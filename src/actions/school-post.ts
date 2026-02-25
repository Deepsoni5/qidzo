"use server";

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { invalidateCache } from "@/lib/redis";
import { revalidatePath } from "next/cache";

interface CreateSchoolPostParams {
  categoryId: string;
  title?: string;
  content: string;
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT" | "NONE";
  mediaUrl?: string | null;
  mediaThumbnail?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export async function createSchoolPost(params: CreateSchoolPostParams) {
  try {
    // 1. Verify school authentication
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, school_id, posts_count")
      .eq("clerk_id", user.id)
      .single();

    if (schoolError) {
      console.error("School query error:", schoolError);
      return {
        success: false,
        error: `Database error: ${schoolError.message}`,
      };
    }

    if (!school) {
      console.error("No school found for clerk_id:", user.id);
      return {
        success: false,
        error: "School not found. Please ensure you're logged in as a school.",
      };
    }

    // 2. Generate unique post_id
    const postId = `post_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // 3. Insert Post
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        post_id: postId,
        school_id: school.id,
        publisher_type: "SCHOOL",
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

    if (error) {
      console.error("Error creating school post:", error);
      return { success: false, error: error.message };
    }

    // 4. Update School Stats (posts_count)
    const newPostsCount = (school.posts_count || 0) + 1;
    await supabase
      .from("schools")
      .update({ posts_count: newPostsCount })
      .eq("id", school.id);

    // 5. Invalidate Caches
    await invalidateCache(`school:dashboard:${school.id}`);
    await invalidateCache(`feed:posts:*`);
    await invalidateCache(`school:posts:${school.id}`);

    revalidatePath("/school/posts");
    revalidatePath("/");

    return { success: true, post };
  } catch (error: any) {
    console.error("Create School Post Error:", error);
    return { success: false, error: error.message || "Failed to create post" };
  }
}

export async function deleteSchoolPost(postId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("id, posts_count")
      .eq("clerk_id", user.id)
      .single();

    if (!school) {
      return { success: false, error: "School not found" };
    }

    // Verify post belongs to this school
    const { data: post } = await supabase
      .from("posts")
      .select("school_id")
      .eq("post_id", postId)
      .single();

    if (!post || post.school_id !== school.id) {
      return { success: false, error: "Post not found or unauthorized" };
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from("posts")
      .update({ is_active: false })
      .eq("post_id", postId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Update school stats
    const newPostsCount = Math.max(0, (school.posts_count || 0) - 1);
    await supabase
      .from("schools")
      .update({ posts_count: newPostsCount })
      .eq("id", school.id);

    // Invalidate caches
    await invalidateCache(`school:dashboard:${school.id}`);
    await invalidateCache(`feed:posts:*`);
    await invalidateCache(`school:posts:${school.id}`);

    revalidatePath("/school/posts");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Delete School Post Error:", error);
    return { success: false, error: error.message || "Failed to delete post" };
  }
}

export async function getSchoolCategories() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("category_type", "SCHOOL")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching school categories:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get school categories error:", error);
    return [];
  }
}
