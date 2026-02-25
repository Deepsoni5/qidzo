"use server";

import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "./auth";
import { currentUser } from "@clerk/nextjs/server";
import { invalidateCache } from "@/lib/redis";

export async function toggleFollow(
  targetId: string,
  targetType: "PARENT" | "CHILD" | "SCHOOL",
) {
  try {
    // 1. Determine Current User (Child, Parent, or School)
    let followerChildId: string | null = null;
    let followerParentId: string | null = null;
    let followerSchoolId: string | null = null;
    let followerType: "PARENT" | "CHILD" | "SCHOOL" | null = null;

    // Check Child Session
    const childSession = await getChildSession();
    if (childSession) {
      followerChildId = childSession.id as string;
      followerType = "CHILD";
    } else {
      // Check Parent/School Session
      const user = await currentUser();
      if (user) {
        // Try Parent
        const { data: parentData } = await supabase
          .from("parents")
          .select("parent_id")
          .eq("clerk_id", user.id)
          .single();

        if (parentData) {
          followerParentId = parentData.parent_id;
          followerType = "PARENT";
        } else {
          // Try School
          const { data: schoolData } = await supabase
            .from("schools")
            .select("school_id")
            .eq("clerk_id", user.id)
            .single();

          if (schoolData) {
            followerSchoolId = schoolData.school_id;
            followerType = "SCHOOL";
          }
        }
      }
    }

    if (
      !followerType ||
      (!followerChildId && !followerParentId && !followerSchoolId)
    ) {
      return { success: false, error: "Must be logged in to follow users." };
    }

    // 2. Prevent Self-Follow
    if (followerType === targetType) {
      const currentId =
        followerType === "CHILD"
          ? followerChildId
          : followerType === "PARENT"
            ? followerParentId
            : followerSchoolId;
      if (currentId === targetId) {
        return { success: false, error: "You cannot follow yourself." };
      }
    }

    // 3. Check if already following
    let query = supabase.from("follows").select("id");

    // Filter by Follower (Current User)
    if (followerType === "CHILD") {
      query = query.eq("follower_child_id", followerChildId);
    } else if (followerType === "PARENT") {
      query = query.eq("follower_parent_id", followerParentId);
    } else {
      query = query.eq("follower_school_id", followerSchoolId);
    }

    // Filter by Following (Target User)
    if (targetType === "CHILD") {
      query = query.eq("following_child_id", targetId);
    } else if (targetType === "PARENT") {
      query = query.eq("following_parent_id", targetId);
    } else {
      query = query.eq("following_school_id", targetId);
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

      // Update stats (target could be a school)
      if (targetType === "SCHOOL") {
        // Decrement school followers count
        const { data: schoolData } = await supabase
          .from("schools")
          .select("followers_count, id")
          .eq("school_id", targetId)
          .single();

        if (schoolData) {
          const currentCount = schoolData.followers_count || 0;
          const newCount = Math.max(0, currentCount - 1);

          await supabase
            .from("schools")
            .update({ followers_count: newCount })
            .eq("school_id", targetId);

          // Invalidate school dashboard cache
          await invalidateCache(`school:dashboard:${schoolData.id}`);
        }
      } else if (targetType === "CHILD") {
        // DECREASE XP (15 points) for Child target
        const { data: childData } = await supabase
          .from("children")
          .select("xp_points, username, followers_count")
          .eq("child_id", targetId)
          .single();

        if (childData) {
          const currentXp = childData.xp_points || 0;
          const currentFollowers = childData.followers_count || 0;
          const newXp = Math.max(0, currentXp - 15);
          const newFollowers = Math.max(0, currentFollowers - 1);

          await supabase
            .from("children")
            .update({
              xp_points: newXp,
              followers_count: newFollowers,
            })
            .eq("child_id", targetId);

          // Invalidate Profile Cache
          if (childData.username) {
            await invalidateCache(`profile:${childData.username}`);
          }
        }
      } else if (targetType === "PARENT") {
        const { data: parentData } = await supabase
          .from("parents")
          .select("followers_count")
          .eq("parent_id", targetId)
          .single();

        if (parentData) {
          const currentFollowers = parentData.followers_count || 0;
          const newFollowers = Math.max(0, currentFollowers - 1);

          await supabase
            .from("parents")
            .update({ followers_count: newFollowers })
            .eq("parent_id", targetId);
        }
      }
    } else {
      // FOLLOW
      const insertData: any = {
        follower_type: followerType,
        following_type: targetType,
      };

      // Set Follower
      if (followerType === "CHILD")
        insertData.follower_child_id = followerChildId;
      else if (followerType === "PARENT")
        insertData.follower_parent_id = followerParentId;
      else insertData.follower_school_id = followerSchoolId;

      // Set Following
      if (targetType === "CHILD") insertData.following_child_id = targetId;
      else if (targetType === "PARENT")
        insertData.following_parent_id = targetId;
      else insertData.following_school_id = targetId;

      const { error: insertError } = await supabase
        .from("follows")
        .insert(insertData);

      if (insertError) {
        console.error("Error following:", insertError);
        return { success: false, error: "Failed to follow" };
      }

      // Update stats (target could be a school)
      if (targetType === "SCHOOL") {
        // Increment school followers count
        const { data: schoolData } = await supabase
          .from("schools")
          .select("followers_count, id")
          .eq("school_id", targetId)
          .single();

        if (schoolData) {
          const currentCount = schoolData.followers_count || 0;
          const newCount = currentCount + 1;

          await supabase
            .from("schools")
            .update({ followers_count: newCount })
            .eq("school_id", targetId);

          // Invalidate school dashboard cache
          await invalidateCache(`school:dashboard:${schoolData.id}`);
        }
      } else if (targetType === "CHILD") {
        // INCREASE XP (15 points) for Child target
        const { data: childData } = await supabase
          .from("children")
          .select("xp_points, username, followers_count")
          .eq("child_id", targetId)
          .single();

        if (childData) {
          const currentXp = childData.xp_points || 0;
          const currentFollowers = childData.followers_count || 0;
          const newXp = currentXp + 15;
          const newFollowers = currentFollowers + 1;

          await supabase
            .from("children")
            .update({
              xp_points: newXp,
              followers_count: newFollowers,
            })
            .eq("child_id", targetId);

          // Invalidate Profile Cache
          if (childData.username) {
            await invalidateCache(`profile:${childData.username}`);
          }
        }
      } else if (targetType === "PARENT") {
        const { data: parentData } = await supabase
          .from("parents")
          .select("followers_count")
          .eq("parent_id", targetId)
          .single();

        if (parentData) {
          const currentFollowers = parentData.followers_count || 0;
          const newFollowers = currentFollowers + 1;

          await supabase
            .from("parents")
            .update({ followers_count: newFollowers })
            .eq("parent_id", targetId);
        }
      }
    }

    // Invalidate Follower's Profile Cache (to update "Following" count)
    if (
      followerType === "CHILD" &&
      childSession &&
      typeof childSession.username === "string"
    ) {
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

export async function getFollowStatus(
  targetId: string,
  targetType: "PARENT" | "CHILD" | "SCHOOL",
) {
  try {
    let followerChildId: string | null = null;
    let followerParentId: string | null = null;
    let followerSchoolId: string | null = null;
    let followerType: "PARENT" | "CHILD" | "SCHOOL" | null = null;

    const childSession = await getChildSession();
    if (childSession) {
      followerChildId = childSession.id as string;
      followerType = "CHILD";
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
          followerType = "PARENT";
        } else {
          const { data: schoolData } = await supabase
            .from("schools")
            .select("school_id")
            .eq("clerk_id", user.id)
            .single();
          if (schoolData) {
            followerSchoolId = schoolData.school_id;
            followerType = "SCHOOL";
          }
        }
      }
    }

    if (
      !followerType ||
      (!followerChildId && !followerParentId && !followerSchoolId)
    ) {
      return false;
    }

    // Prevent checking self-follow (always false)
    if (followerType === targetType) {
      const currentId =
        followerType === "CHILD"
          ? followerChildId
          : followerType === "PARENT"
            ? followerParentId
            : followerSchoolId;
      if (currentId === targetId) return false;
    }

    let query = supabase.from("follows").select("id");

    // Filter by Follower (Current User)
    if (followerType === "CHILD") {
      query = query.eq("follower_child_id", followerChildId);
    } else if (followerType === "PARENT") {
      query = query.eq("follower_parent_id", followerParentId);
    } else {
      query = query.eq("follower_school_id", followerSchoolId);
    }

    // Filter by Following (Target User)
    if (targetType === "CHILD") {
      query = query.eq("following_child_id", targetId);
    } else if (targetType === "PARENT") {
      query = query.eq("following_parent_id", targetId);
    } else {
      query = query.eq("following_school_id", targetId);
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
