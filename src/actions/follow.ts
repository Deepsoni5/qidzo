"use server";

import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "./auth";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redis, invalidateCache } from "@/lib/redis";

export async function toggleFollow(targetId: string, targetType: 'PARENT' | 'CHILD') {
  try {
    // 1. Determine Current User (Child or Parent)
    let followerChildId: string | null = null;
    let followerParentId: string | null = null;
    let followerType: 'PARENT' | 'CHILD' | null = null;

    // Check Child Session
    const childSession = await getChildSession();
    if (childSession) {
      followerChildId = childSession.id as string;
      followerType = 'CHILD';
    } else {
      // Check Parent Session
      const user = await currentUser();
      if (user) {
        const { data: parentData } = await supabase
          .from("parents")
          .select("parent_id")
          .eq("clerk_id", user.id)
          .single();
          
        if (parentData) {
          followerParentId = parentData.parent_id;
          followerType = 'PARENT';
        }
      }
    }

    if (!followerType || (!followerChildId && !followerParentId)) {
      return { success: false, error: "Must be logged in to follow users." };
    }

    // 2. Prevent Self-Follow
    if (followerType === targetType) {
        const currentId = followerType === 'CHILD' ? followerChildId : followerParentId;
        if (currentId === targetId) {
            return { success: false, error: "You cannot follow yourself." };
        }
    }

    // 3. Check if already following
    let query = supabase
      .from("follows")
      .select("id");

    // Filter by Follower (Current User)
    if (followerType === 'CHILD') {
        query = query.eq("follower_child_id", followerChildId);
    } else {
        query = query.eq("follower_parent_id", followerParentId);
    }

    // Filter by Following (Target User)
    if (targetType === 'CHILD') {
        query = query.eq("following_child_id", targetId);
    } else {
        query = query.eq("following_parent_id", targetId);
    }

    const { data: existingFollow, error: checkError } = await query.single();

    if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking follow status:", checkError);
        return { success: false, error: "Database error checking follow status" };
    }

    const isFollowing = !!existingFollow;

    if (isFollowing) {
        // UNFOLLOW
        const { error: deleteError } = await supabase
            .from("follows")
            .delete()
            .eq("id", existingFollow.id);

        if (deleteError) {
            console.error("Error unfollowing:", deleteError);
            return { success: false, error: "Failed to unfollow" };
        }

        // DECREASE XP (15 points) for Child target
        if (targetType === 'CHILD') {
            const { data: childData } = await supabase
                .from("children")
                .select("xp_points, username")
                .eq("child_id", targetId)
                .single();
            
            if (childData) {
                const currentXp = childData.xp_points || 0;
                const newXp = Math.max(0, currentXp - 15);
                
                await supabase
                    .from("children")
                    .update({ xp_points: newXp })
                    .eq("child_id", targetId);

                // Invalidate Profile Cache
                if (childData.username) {
                    await invalidateCache(`profile:${childData.username}`);
                }
            }
        }
    } else {
        // FOLLOW
        const insertData: any = {
            follower_type: followerType,
            following_type: targetType,
        };

        if (followerType === 'CHILD') insertData.follower_child_id = followerChildId;
        else insertData.follower_parent_id = followerParentId;

        if (targetType === 'CHILD') insertData.following_child_id = targetId;
        else insertData.following_parent_id = targetId;

        const { error: insertError } = await supabase
            .from("follows")
            .insert(insertData);

        if (insertError) {
            console.error("Error following:", insertError);
            return { success: false, error: "Failed to follow" };
        }

        // INCREASE XP (15 points) for Child target
        if (targetType === 'CHILD') {
            const { data: childData } = await supabase
                .from("children")
                .select("xp_points, username")
                .eq("child_id", targetId)
                .single();
            
            if (childData) {
                const currentXp = childData.xp_points || 0;
                const newXp = currentXp + 15;
                
                await supabase
                    .from("children")
                    .update({ xp_points: newXp })
                    .eq("child_id", targetId);

                // Invalidate Profile Cache
                if (childData.username) {
                    await invalidateCache(`profile:${childData.username}`);
                }
            }
        }
    }

    // Invalidate Follower's Profile Cache (to update "Following" count)
    if (followerType === 'CHILD' && childSession && typeof childSession.username === 'string') {
        await invalidateCache(`profile:${childSession.username}`);
    }

    // Revalidate relevant paths
    // We might want to revalidate the profile page of the target user
    // revalidatePath(`/child/${targetId}`); // Assuming route structure, but we usually use username.
    // Since we don't have username here easily without another query, we'll skip specific path revalidation 
    // and rely on client-side state update or general revalidation if needed.
    
    return { success: true, isFollowing: !isFollowing };

  } catch (error) {
    console.error("Toggle follow error:", error);
    return { success: false, error: "Unexpected error" };
  }
}

export async function getFollowStatus(targetId: string, targetType: 'PARENT' | 'CHILD') {
    try {
        let followerChildId: string | null = null;
        let followerParentId: string | null = null;
        let followerType: 'PARENT' | 'CHILD' | null = null;

        const childSession = await getChildSession();
        if (childSession) {
            followerChildId = childSession.id as string;
            followerType = 'CHILD';
        } else {
            const user = await currentUser();
            if (user) {
                const { data: parentData } = await supabase
                    .from("parents")
                    .select("parent_id")
                    .eq("clerk_id", user.id)
                    .single();
                if (parentData) {
                    followerParentId = parentData.parent_id;
                    followerType = 'PARENT';
                }
            }
        }

        if (!followerType || (!followerChildId && !followerParentId)) {
            return false;
        }

        // Prevent checking self-follow (always false)
        if (followerType === targetType) {
            const currentId = followerType === 'CHILD' ? followerChildId : followerParentId;
            if (currentId === targetId) return false;
        }

        let query = supabase
            .from("follows")
            .select("id");

        if (followerType === 'CHILD') {
            query = query.eq("follower_child_id", followerChildId);
        } else {
            query = query.eq("follower_parent_id", followerParentId);
        }

        if (targetType === 'CHILD') {
            query = query.eq("following_child_id", targetId);
        } else {
            query = query.eq("following_parent_id", targetId);
        }

        const { data, error } = await query.single();
        
        if (error && error.code !== "PGRST116") {
             console.error("Error checking follow status:", error);
             return false;
        }

        return !!data;

    } catch (error) {
        console.error("Get follow status error:", error);
        return false;
    }
}
