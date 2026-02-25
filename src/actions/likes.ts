"use server";

import { supabase } from "@/lib/supabaseClient";
import { redis, invalidateCache } from "@/lib/redis";
import { getChildSession } from "./auth";
import { currentUser } from "@clerk/nextjs/server";

export async function toggleLike(postId: string) {
  try {
    // 1. Determine User (Child, Parent, or School)
    let childId: string | null = null;
    let parentId: string | null = null;
    let schoolId: string | null = null;
    let likerType: string | null = null;

    // Check Child Session
    const childSession = await getChildSession();
    if (childSession) {
      childId = childSession.id as string;
      likerType = "CHILD";
    } else {
      // Check Parent/School Session
      const user = await currentUser();
      if (user) {
        // 1a. Try to find parent_id
        const { data: parentData } = await supabase
          .from("parents")
          .select("parent_id")
          .eq("clerk_id", user.id)
          .single();

        if (parentData) {
          parentId = parentData.parent_id;
          likerType = "PARENT";
        } else {
          // 1b. Try to find school_id (using internal school_id for like)
          const { data: schoolData } = await supabase
            .from("schools")
            .select("school_id")
            .eq("clerk_id", user.id)
            .single();

          if (schoolData) {
            schoolId = schoolData.school_id;
            likerType = "SCHOOL";
          }
        }
      }
    }

    if (!likerType) {
      console.log("Toggle Like Failed: No user logged in");
      return { success: false, error: "Must be logged in to like posts." };
    }

    // 2. Check if already liked
    let query = supabase.from("likes").select("id").eq("post_id", postId);

    if (childId) {
      query = query.eq("child_id", childId);
    } else if (parentId) {
      query = query.eq("parent_id", parentId);
    } else {
      query = query.eq("school_id", schoolId);
    }

    const { data: existingLike, error: checkError } = await query.single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "Row not found"
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
      // Manual Decrement
      const { data: currentPost } = await supabase
        .from("posts")
        .select("likes_count")
        .eq("post_id", postId)
        .single();
      const currentCount = currentPost?.likes_count || 0;
      const newCount = Math.max(0, currentCount - 1);

      const { error: updateError } = await supabase
        .from("posts")
        .update({ likes_count: newCount })
        .eq("post_id", postId);
      if (updateError) {
        console.error("Error updating likes count (decrement):", updateError);
      }
      newLikesCount = newCount;

      // REVERSE XP (Subtract 5 XP from Post Owner) & DECREMENT TOTAL LIKES
      const { data: postForXp } = await supabase
        .from("posts")
        .select("child_id, school_id")
        .eq("post_id", postId)
        .single();
      const postOwnerChildId = postForXp?.child_id;
      const postOwnerSchoolId = postForXp?.school_id;

      if (postOwnerChildId) {
        const { data: owner } = await supabase
          .from("children")
          .select("xp_points, total_likes_received")
          .eq("child_id", postOwnerChildId)
          .single();
        const currentXp = owner?.xp_points || 0;
        const currentTotalLikes = owner?.total_likes_received || 0;

        const newXp = Math.max(0, currentXp - 5);
        const newTotalLikes = Math.max(0, currentTotalLikes - 1);

        await supabase
          .from("children")
          .update({
            xp_points: newXp,
            total_likes_received: newTotalLikes,
          })
          .eq("child_id", postOwnerChildId);

        await redis.del(`profile:${postOwnerChildId}`);
      } else if (postOwnerSchoolId) {
        // Decrement school's total_likes_received
        const { data: school } = await supabase
          .from("schools")
          .select("total_likes_received")
          .eq("id", postOwnerSchoolId)
          .single();

        if (school) {
          const currentTotalLikes = school.total_likes_received || 0;
          const newTotalLikes = Math.max(0, currentTotalLikes - 1);

          await supabase
            .from("schools")
            .update({ total_likes_received: newTotalLikes })
            .eq("id", postOwnerSchoolId);
        }
      }
    } else {
      // LIKE
      const { error: insertError } = await supabase.from("likes").insert({
        post_id: postId,
        child_id: childId,
        parent_id: parentId,
        school_id: schoolId,
        liker_type: likerType,
      });

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
      const { data: currentPost } = await supabase
        .from("posts")
        .select("likes_count, child_id, school_id")
        .eq("post_id", postId)
        .single();
      const currentCount = currentPost?.likes_count || 0;
      const postOwnerId = currentPost?.child_id;
      const newCount = currentCount + 1;

      const { error: updateError } = await supabase
        .from("posts")
        .update({ likes_count: newCount })
        .eq("post_id", postId);
      if (updateError) {
        console.error("Error updating likes count (increment):", updateError);
      }
      newLikesCount = newCount;

      // AWARD XP to Post Owner (5 XP) & INCREMENT TOTAL LIKES
      if (postOwnerId) {
        const { data: owner } = await supabase
          .from("children")
          .select("xp_points, total_likes_received")
          .eq("child_id", postOwnerId)
          .single();
        const currentXp = owner?.xp_points || 0;
        const currentTotalLikes = owner?.total_likes_received || 0;

        const newXp = currentXp + 5;
        const newTotalLikes = currentTotalLikes + 1;

        await supabase
          .from("children")
          .update({
            xp_points: newXp,
            total_likes_received: newTotalLikes,
          })
          .eq("child_id", postOwnerId);

        await redis.del(`profile:${postOwnerId}`);
      }

      // Increment school's total_likes_received if post is from school
      const postOwnerSchoolId = currentPost?.school_id;
      if (postOwnerSchoolId) {
        const { data: school } = await supabase
          .from("schools")
          .select("total_likes_received")
          .eq("id", postOwnerSchoolId)
          .single();

        if (school) {
          const currentTotalLikes = school.total_likes_received || 0;
          const newTotalLikes = currentTotalLikes + 1;

          await supabase
            .from("schools")
            .update({ total_likes_received: newTotalLikes })
            .eq("id", postOwnerSchoolId);
        }
      }
    }

    // 3. Invalidate/Update Caches
    // Invalidate Feed Cache to ensure counts are fresh on reload
    await invalidateCache("feed:posts:*");

    // removed revalidatePath("/") to prevent page reload

    return { success: true, likesCount: newLikesCount, isLiked: !isLiked };
  } catch (error) {
    console.error("Toggle like error:", error);
    return { success: false, error: "Unexpected error" };
  }
}

export async function hasLikedPost(postId: string) {
  let childId: string | null = null;
  let parentId: string | null = null;
  let schoolId: string | null = null;

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

      if (parentData) {
        parentId = parentData.parent_id;
      } else {
        // Check for school
        const { data: schoolData } = await supabase
          .from("schools")
          .select("school_id")
          .eq("clerk_id", user.id)
          .single();

        if (schoolData) schoolId = schoolData.school_id;
      }
    }
  }

  if (!childId && !parentId && !schoolId) return false;

  let query = supabase.from("likes").select("id").eq("post_id", postId);

  if (childId) {
    query = query.eq("child_id", childId);
  } else if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.eq("school_id", schoolId);
  }

  const { data } = await query.single();

  return !!data;
}
