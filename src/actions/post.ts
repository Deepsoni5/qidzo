"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { redis, invalidateCache } from "@/lib/redis";
import { currentUser } from "@clerk/nextjs/server";
import { getChildSession } from "./auth";

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
      .from("posts")
      .insert({
        post_id: postId,
        child_id: params.childId,
        category_id: params.categoryId,
        title: params.title || null,
        content: params.content,
        media_type: params.mediaType,
        media_url: params.mediaUrl || null,
        media_thumbnail: params.mediaThumbnail || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Update Child Stats (Total Posts, XP)
    // Manual update without RPC to avoid schema errors
    const { data: child } = await supabase
      .from("children")
      .select("total_posts, xp_points")
      .eq("child_id", params.childId)
      .single();

    if (child) {
      const { error: updateError } = await supabase
        .from("children")
        .update({
          total_posts: (child.total_posts || 0) + 1,
          xp_points: (child.xp_points || 0) + 10,
        })
        .eq("child_id", params.childId);

      if (updateError) {
        console.error("Failed to update child stats manually:", updateError);
        // We don't throw here to ensure the post creation itself isn't rolled back
        // just because stats failed, unless strict consistency is required.
        // But usually better to let the post stay.
      }
    }

    // 4. Invalidate Feed Caches
    // Invalidate all feed cache keys (all pages, all category combinations)
    await invalidateCache("feed:posts:*");

    // Invalidate child profile cache
    await invalidateCache(`profile:posts:${params.childId}`);

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
 * Handles both Child and School ownership with session verification.
 */
export async function deletePost(postId: string, ownerId: string) {
  try {
    // 1. Verify session ownership for security
    let isAuthorized = false;

    const childSession = await getChildSession();
    if (childSession && childSession.id === ownerId) {
      isAuthorized = true;
    } else {
      const user = await currentUser();
      if (user) {
        const { data: school } = await supabase
          .from("schools")
          .select("id")
          .eq("clerk_id", user.id)
          .single();

        if (school && school.id === ownerId) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized to delete this post" };
    }

    // 2. Identify if it's a child or school post to handle stats
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("child_id, school_id, publisher_type")
      .eq("post_id", postId)
      .single();

    if (postError || !post) throw new Error("Post not found");

    // 3. Soft delete the post
    const { error: deleteError } = await supabase
      .from("posts")
      .update({ is_active: false })
      .eq("post_id", postId);

    if (deleteError) throw deleteError;

    // 4. Update Stats and Invalidate Caches
    if (post.publisher_type === "CHILD" && post.child_id === ownerId) {
      const { data: child } = await supabase
        .from("children")
        .select("total_posts, xp_points")
        .eq("child_id", ownerId)
        .single();

      if (child) {
        await supabase
          .from("children")
          .update({
            total_posts: Math.max(0, (child.total_posts || 0) - 1),
            xp_points: Math.max(0, (child.xp_points || 0) - 10),
          })
          .eq("child_id", ownerId);
      }
      await redis.del(`child:stats:${ownerId}`);
    } else if (post.publisher_type === "SCHOOL" && post.school_id === ownerId) {
      const { data: school } = await supabase
        .from("schools")
        .select("posts_count")
        .eq("id", ownerId)
        .single();

      if (school) {
        await supabase
          .from("schools")
          .update({
            posts_count: Math.max(0, (school.posts_count || 0) - 1),
          })
          .eq("id", ownerId);
      }
      await redis.del(`school:dashboard:${ownerId}`);
      await redis.del(`school:posts:${ownerId}`);
    }

    // 5. Clear general feed cache
    await redis.del(`feed:all`);
    await invalidateCache(`feed:posts:*`);

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
 * Handles both Child and School ownership with session verification.
 */
export async function updatePost(
  postId: string,
  ownerId: string,
  updates: {
    title?: string;
    content?: string;
    categoryId?: string;
  },
) {
  try {
    // 1. Verify session ownership for security
    let isAuthorized = false;

    const childSession = await getChildSession();
    if (childSession && childSession.id === ownerId) {
      isAuthorized = true;
    } else {
      const user = await currentUser();
      if (user) {
        const { data: school } = await supabase
          .from("schools")
          .select("id")
          .eq("clerk_id", user.id)
          .single();

        if (school && school.id === ownerId) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized to update this post" };
    }

    // 2. Perform Update
    const { error } = await supabase
      .from("posts")
      .update({
        title: updates.title,
        content: updates.content,
        category_id: updates.categoryId,
        updated_at: new Date().toISOString(),
      })
      .eq("post_id", postId)
      .or(`child_id.eq.${ownerId},school_id.eq.${ownerId}`);

    if (error) throw error;

    // 3. Clear relevant caches
    await redis.del(`feed:all`);
    await invalidateCache(`feed:posts:*`);

    // Specific user caches
    await redis.del(`child:stats:${ownerId}`);
    await redis.del(`school:dashboard:${ownerId}`);
    await redis.del(`school:posts:${ownerId}`);

    revalidatePath("/");
    revalidatePath("/playzone");
    revalidatePath(`/school/${ownerId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Update Post Error:", error);
    return { success: false, error: error.message };
  }
}
