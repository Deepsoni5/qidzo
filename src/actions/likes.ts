"use server";

import { supabase } from "@/lib/supabaseClient";
import { redis, invalidateCache } from "@/lib/redis";
import { getChildSession } from "./auth";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function toggleLike(postId: string) {
  try {
    // 1. Determine User (Child or Parent)
    let childId: string | null = null;
    let parentId: string | null = null;
    
    // Check Child Session
    const childSession = await getChildSession();
    if (childSession) {
      childId = childSession.id as string;
    } else {
      // Check Parent Session
      const user = await currentUser();
      if (user) {
        // Fetch actual parent_id from database using Clerk ID
        const { data: parentData } = await supabase
          .from("parents")
          .select("parent_id")
          .eq("clerk_id", user.id)
          .single();
          
        if (parentData) {
          parentId = parentData.parent_id;
        }
      }
    }

    if (!childId && !parentId) {
      console.log("Toggle Like Failed: No user logged in");
      return { success: false, error: "Must be logged in to like posts." };
    }

    // 2. Check if already liked
    let query = supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId);
      
    if (childId) {
        query = query.eq("child_id", childId);
    } else {
        query = query.eq("parent_id", parentId);
    }
    
    const { data: existingLike, error: checkError } = await query.single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 is "Row not found"
        console.error("Error checking like:", checkError);
        return { success: false, error: "Database error checking like" };
    }

    const isLiked = !!existingLike;
    let newLikesCount = 0;

    if (isLiked) {
      // UNLIKE
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        console.error("Error deleting like:", deleteError);
        return { success: false, error: "Failed to unlike" };
      }
      
      // Decrement post likes count
      const { data: postData, error: decrementError } = await supabase.rpc('decrement_likes', { row_id: postId });
      
      // If RPC doesn't exist (it might not), fall back to manual update
      if (decrementError) {
         // Manual Decrement
         const { data: currentPost } = await supabase.from('posts').select('likes_count').eq('post_id', postId).single();
         const currentCount = currentPost?.likes_count || 0;
         const newCount = Math.max(0, currentCount - 1);
         
         await supabase.from('posts').update({ likes_count: newCount }).eq('post_id', postId);
         newLikesCount = newCount;
      } else {
         newLikesCount = postData;
      }

      // REVERSE XP (Subtract 5 XP from Post Owner) & DECREMENT TOTAL LIKES
      const { data: postForXp } = await supabase.from('posts').select('child_id').eq('post_id', postId).single();
      const postOwnerId = postForXp?.child_id;

      if (postOwnerId) {
          const { data: owner } = await supabase.from('children').select('xp_points, total_likes_received').eq('child_id', postOwnerId).single();
          const currentXp = owner?.xp_points || 0;
          const currentTotalLikes = owner?.total_likes_received || 0;

          const newXp = Math.max(0, currentXp - 5); // Ensure we don't go below 0
          const newTotalLikes = Math.max(0, currentTotalLikes - 1);
          
          await supabase.from('children').update({ 
              xp_points: newXp,
              total_likes_received: newTotalLikes
          }).eq('child_id', postOwnerId);
          
          // Invalidate Owner Profile Cache
          await redis.del(`profile:${postOwnerId}`);
      }

    } else {
      // LIKE
      const insertData: any = { post_id: postId };
      if (childId) {
          insertData.child_id = childId;
      } else {
          insertData.parent_id = parentId;
      }
      
      console.log("Attempting to insert like:", insertData);

      const { error: insertError } = await supabase
        .from("likes")
        .insert(insertData);

      if (insertError) {
        console.error("Error inserting like:", insertError);
        // Specifically check for FK violation
        if (insertError.code === "23503") {
            return { success: false, error: "Invalid user or post ID." };
        }
        return { success: false, error: "Failed to like" };
      }

      // Increment post likes count
      // We can use RPC or manual. Let's try manual first to be safe if RPC is missing.
      const { data: currentPost } = await supabase.from('posts').select('likes_count, child_id').eq('post_id', postId).single();
      const currentCount = currentPost?.likes_count || 0;
      const postOwnerId = currentPost?.child_id;
      const newCount = currentCount + 1;
      
      await supabase.from('posts').update({ likes_count: newCount }).eq('post_id', postId);
      newLikesCount = newCount;

      // AWARD XP to Post Owner (5 XP) & INCREMENT TOTAL LIKES
      if (postOwnerId) {
          const { data: owner } = await supabase.from('children').select('xp_points, total_likes_received').eq('child_id', postOwnerId).single();
          const currentXp = owner?.xp_points || 0;
          const currentTotalLikes = owner?.total_likes_received || 0;

          const newXp = currentXp + 5;
          const newTotalLikes = currentTotalLikes + 1;
          
          await supabase.from('children').update({ 
              xp_points: newXp,
              total_likes_received: newTotalLikes
          }).eq('child_id', postOwnerId);
          
          // Invalidate Owner Profile Cache
          await redis.del(`profile:${postOwnerId}`); // Assuming key structure, might need adjustment
      }
    }

    // 3. Invalidate/Update Caches
    // Invalidate Feed Cache (a bit aggressive, but needed for consistency)
    // Actually, we might want to just return the new count and let UI update optimistically?
    // But for "working condition", invalidating is safer.
    // However, invalidating ALL feed pages is bad.
    // Let's just return success and new count.
    
    // We should invalidate the specific post if we cache individual posts
    // We cache pages of posts... `feed:posts:${page}:${limit}...`
    // It's hard to find which page the post is on.
    // Ideally, we invalidate all feed caches or accept eventual consistency.
    // For now, let's invalidate the generic feed keys if possible or rely on short TTL (60s).
    
    return { success: true, likesCount: newLikesCount, isLiked: !isLiked };

  } catch (error) {
    console.error("Toggle like error:", error);
    return { success: false, error: "Unexpected error" };
  }
}

export async function hasLikedPost(postId: string) {
    let childId: string | null = null;
    let parentId: string | null = null;

    const childSession = await getChildSession();
    if (childSession) {
        childId = childSession.id as string;
    } else {
        const user = await currentUser();
        if (user) {
             const { data: parentData } = await supabase
              .from("parents")
              .select("parent_id")
              .eq("clerk_id", user.id)
              .single();
            
            if (parentData) parentId = parentData.parent_id;
        }
    }

    if (!childId && !parentId) return false;
    
    let query = supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId);

    if (childId) {
        query = query.eq("child_id", childId);
    } else {
        query = query.eq("parent_id", parentId);
    }
      
    const { data } = await query.single();
      
    return !!data;
}
