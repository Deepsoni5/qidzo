"use server";

import { supabase } from "@/lib/supabaseClient";
import { redis, getOrSetCache, invalidateCache } from "@/lib/redis";
import { getChildSession } from "./auth";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Generate a 10-character ID
function generateCommentId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function addComment(postId: string, content: string) {
  try {
    // 1. Determine User (Child or Parent)
    let childId: string | null = null;
    let parentId: string | null = null;
    let userType: 'CHILD' | 'PARENT' | null = null;

    const childSession = await getChildSession();
    if (childSession) {
      childId = childSession.id as string;
      userType = 'CHILD';
    } else {
      const user = await currentUser();
      if (user) {
        const { data: parentData } = await supabase
          .from("parents")
          .select("parent_id")
          .eq("clerk_id", user.id)
          .single();
        
        if (parentData) {
          parentId = parentData.parent_id;
          userType = 'PARENT';
        }
      }
    }

    if (!userType) {
      return { success: false, error: "Must be logged in to comment." };
    }

    // 2. Validate Content
    if (!content || content.length === 0 || content.length > 500) {
        return { success: false, error: "Comment must be between 1 and 500 characters." };
    }

    const commentId = generateCommentId();

    // 3. Insert Comment
    const insertData: any = {
        comment_id: commentId,
        post_id: postId,
        user_type: userType,
        content: content,
        likes_count: 0,
        is_active: true,
        is_edited: false
    };

    if (userType === 'CHILD') {
        insertData.child_id = childId;
    } else {
        insertData.parent_id = parentId;
    }

    const { error: insertError } = await supabase
        .from("comments")
        .insert(insertData);

    if (insertError) {
        console.error("Error inserting comment:", insertError);
        return { success: false, error: "Failed to post comment." };
    }

    let newCommentsCount = 0;

    // 4. Update Post Comments Count (Source of Truth)
    // Instead of relying on RPC or increments, we count the actual rows to ensure accuracy.
    const { count, error: countError } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

    const actualCount = count ?? 0;

    const { error: updateError } = await supabase
        .from("posts")
        .update({ comments_count: actualCount })
        .eq("post_id", postId);

    if (updateError) {
        console.error("Error updating post comment count:", updateError);
    }
    
    newCommentsCount = actualCount;

    // Handle XP/Stats
    const { data: postForXp } = await supabase.from('posts').select('child_id').eq('post_id', postId).single();
    await handleCommentStats(postForXp?.child_id, childId, true);

    // Invalidate Redis Cache for Comments List
    await invalidateCache(`comments:${postId}`);
    // Invalidate Feed Cache to update counts on home/feed pages
    await invalidateCache('feed:posts:*');

    
    return { success: true, commentId, commentsCount: newCommentsCount };

  } catch (error) {
    console.error("Add comment error:", error);
    return { success: false, error: "Unexpected error" };
  }
}

export async function deleteComment(commentId: string) {
    try {
        // 1. Identify User
        let childId: string | null = null;
        let parentId: string | null = null;
        
        const childSession = await getChildSession();
        if (childSession) childId = childSession.id as string;
        else {
            const user = await currentUser();
            if (user) {
                const { data: parentData } = await supabase.from("parents").select("parent_id").eq("clerk_id", user.id).single();
                if (parentData) parentId = parentData.parent_id;
            }
        }

        if (!childId && !parentId) return { success: false, error: "Unauthorized" };

        // 2. Fetch Comment to verify ownership and get post_id
        const { data: comment, error: fetchError } = await supabase
            .from("comments")
            .select("id, post_id, child_id, parent_id")
            .eq("comment_id", commentId)
            .single();

        if (fetchError || !comment) return { success: false, error: "Comment not found" };

        // Verify Ownership
        if (childId && comment.child_id !== childId) return { success: false, error: "Unauthorized" };
        if (parentId && comment.parent_id !== parentId) return { success: false, error: "Unauthorized" };

        // 3. Delete Comment
        const { error: deleteError } = await supabase.from("comments").delete().eq("id", comment.id);
        if (deleteError) return { success: false, error: "Failed to delete comment" };

        // 4. Update Post Comments Count (Source of Truth)
        // Instead of relying on RPC or increments, we count the actual rows to ensure accuracy.
        const { count, error: countError } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", comment.post_id);

        const actualCount = count ?? 0;

        const { error: updateError } = await supabase
            .from("posts")
            .update({ comments_count: actualCount })
            .eq("post_id", comment.post_id);
            
        if (updateError) {
             console.error("Error updating post comment count:", updateError);
        }
        
        const newCommentsCount = actualCount;

        // 5. Reverse Stats
        // Need post owner ID
        const { data: postForXp } = await supabase.from('posts').select('child_id').eq('post_id', comment.post_id).single();
        // Pass the ORIGINAL commenter ID (which is childId or null if parent)
        await handleCommentStats(postForXp?.child_id, comment.child_id, false);

        // Invalidate Redis Cache for Comments List
        await invalidateCache(`comments:${comment.post_id}`);
        // Invalidate Feed Cache to update counts on home/feed pages
        await invalidateCache('feed:posts:*');

        
        return { success: true, commentsCount: newCommentsCount };

    } catch (error) {
        console.error("Delete comment error:", error);
        return { success: false, error: "Unexpected error" };
    }
}

// Helper to handle XP and Stats updates
async function handleCommentStats(postOwnerId: string | null | undefined, commenterChildId: string | null | undefined, isAdding: boolean) {
    // 1. XP for Post Owner (+5 / -5)
    if (postOwnerId) {
        const { data: owner } = await supabase.from('children').select('xp_points, username').eq('child_id', postOwnerId).single();
        if (owner) {
            const currentXp = owner.xp_points || 0;
            const newXp = isAdding ? currentXp + 5 : Math.max(0, currentXp - 5);
            
            await supabase.from('children').update({ xp_points: newXp }).eq('child_id', postOwnerId);
            await invalidateCache(`profile:${postOwnerId}`); // Invalidate ID-based cache
            if (owner.username) {
                await invalidateCache(`profile:${owner.username}`); // Invalidate Username-based cache
            }
        }
    }

    // 2. Total Comments Made for Commenter (if Child) (+1 / -1)
    if (commenterChildId) {
        const { data: commenter } = await supabase.from('children').select('total_comments_made, username').eq('child_id', commenterChildId).single();
        if (commenter) {
            const currentTotal = commenter.total_comments_made || 0;
            const newTotal = isAdding ? currentTotal + 1 : Math.max(0, currentTotal - 1);
            
            await supabase.from('children').update({ total_comments_made: newTotal }).eq('child_id', commenterChildId);
            await invalidateCache(`profile:${commenterChildId}`); // Invalidate ID-based cache
            if (commenter.username) {
                await invalidateCache(`profile:${commenter.username}`); // Invalidate Username-based cache
            }
        }
    }
}

export async function getComments(postId: string) {
    const cacheKey = `comments:${postId}`;

    return getOrSetCache<any[]>(
        cacheKey,
        async () => {
            const { data, error } = await supabase
                .from("comments")
                .select(`
                    *,
                    child:children(name, username, avatar),
                    parent:parents(parent_id) 
                `)
                .eq("post_id", postId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching comments:", error);
                return [];
            }

            return data;
        },
        300 // 5 minutes cache
    );
}
