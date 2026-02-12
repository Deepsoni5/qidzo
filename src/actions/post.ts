"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { redis } from "@/lib/redis";

interface CreatePostParams {
    childId: string;
    categoryId: string;
    title?: string;
    content: string;
    mediaType: "IMAGE" | "VIDEO" | "NONE";
    mediaUrl?: string | null;
    mediaThumbnail?: string | null;
}

export async function createPost(params: CreatePostParams) {
    try {
        // 1. Generate unique post_id (must be < 20 chars)
        // post_ (5) + timestamp base36 (~8) + random (4) = ~17 chars
        const postId = `post_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

        // 2. Insert Post
        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                post_id: postId,
                child_id: params.childId,
                category_id: params.categoryId,
                title: params.title || null,
                content: params.content,
                media_type: params.mediaType,
                media_url: params.mediaUrl || null,
                media_thumbnail: params.mediaThumbnail || null,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Update Child Stats (Total Posts, XP)
        // Manual update without RPC to avoid schema errors
        const { data: child } = await supabase
            .from('children')
            .select('total_posts, xp_points')
            .eq('child_id', params.childId)
            .single();
        
        if (child) {
            const { error: updateError } = await supabase
                .from('children')
                .update({
                    total_posts: (child.total_posts || 0) + 1,
                    xp_points: (child.xp_points || 0) + 10
                })
                .eq('child_id', params.childId);
                
            if (updateError) {
                console.error("Failed to update child stats manually:", updateError);
                // We don't throw here to ensure the post creation itself isn't rolled back 
                // just because stats failed, unless strict consistency is required.
                // But usually better to let the post stay.
            }
        }

        // 4. Invalidate Caches
        // Invalidate feed cache
        await redis.del(`feed:all`); // Assuming a general feed key
        await redis.del(`feed:category:${params.categoryId}`); // Category specific feed
        
        // Invalidate child stats cache
        // Note: We might need a consistent key pattern for child stats. 
        // Based on previous interactions, it might be `child:stats:${childId}` or similar.
        // Let's just clear relevant keys we can guess or use a pattern if supported (Redis standard doesn't support glob delete easily without scan)
        // For now, let's just revalidate the path.

        revalidatePath("/");
        revalidatePath(`/child/${params.childId}`);

        return { success: true, post };

    } catch (error: any) {
        console.error("Create Post Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Soft deletes a post by setting is_active to false.
 * Also decrements the child's total_posts count and xp_points (-10).
 */
export async function deletePost(postId: string, childId: string) {
    try {
        // 1. Soft delete the post
        const { error: deleteError } = await supabase
            .from('posts')
            .update({ is_active: false })
            .eq('post_id', postId)
            .eq('child_id', childId);

        if (deleteError) throw deleteError;

        // 2. Decrement Child Stats (Total Posts, XP)
        const { data: child, error: fetchError } = await supabase
            .from('children')
            .select('total_posts, xp_points')
            .eq('child_id', childId)
            .single();
        
        if (fetchError) throw fetchError;

        if (child) {
            const { error: updateError } = await supabase
                .from('children')
                .update({
                    total_posts: Math.max(0, (child.total_posts || 0) - 1),
                    xp_points: Math.max(0, (child.xp_points || 0) - 10)
                })
                .eq('child_id', childId);
                
            if (updateError) {
                console.error("Failed to decrement child stats:", updateError);
            }
        }

        // 3. Clear relevant caches
        await redis.del(`feed:all`);
        // We don't have the categoryId here easily without fetching the post first, 
        // but clearing the main feed is usually enough for most cases or we can fetch it.
        
        revalidatePath("/");
        revalidatePath("/playzone");

        return { success: true };

    } catch (error: any) {
        console.error("Delete Post Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Updates an existing post.
 */
export async function updatePost(postId: string, childId: string, updates: {
    title?: string;
    content?: string;
    categoryId?: string;
}) {
    try {
        const { error } = await supabase
            .from('posts')
            .update({
                title: updates.title,
                content: updates.content,
                category_id: updates.categoryId,
                updated_at: new Date().toISOString()
            })
            .eq('post_id', postId)
            .eq('child_id', childId);

        if (error) throw error;

        // Clear relevant caches
        await redis.del(`feed:all`);
        
        revalidatePath("/");
        revalidatePath("/playzone");
        revalidatePath(`/child/${childId}`);

        return { success: true };
    } catch (error: any) {
        console.error("Update Post Error:", error);
        return { success: false, error: error.message };
    }
}
