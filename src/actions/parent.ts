"use server";

import { supabase } from "@/lib/supabaseClient";
import { getOrSetCache, invalidateCache } from "@/lib/redis";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Cache Keys for other features
const KEYS = {
  IS_PARENT: (userId: string) => `user:role:parent:${userId}`,
  PARENT_STATS: (userId: string) => `parent:stats:${userId}`,
  PARENT_CHILDREN: (userId: string) => `parent:children:${userId}`,
  CHILD_DETAILS: (childId: string) => `parent:child:${childId}`,
};

// 1. Check if User is Parent
export async function checkIsParent() {
  try {
    const user = await currentUser();
    if (!user) return false;

    // Check metadata first
    if (user.publicMetadata?.role === "parent") return true;

    // Fallback to Direct DB check
    const { data } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    return !!data;
  } catch (error) {
    console.error("Error in checkIsParent:", error);
    return false;
  }
}

// 1b. Check if User is School
export async function checkIsSchool() {
  try {
    const user = await currentUser();
    if (!user) return false;

    // Check metadata first
    if (user.publicMetadata?.role === "school") return true;

    // Fallback to Direct DB check
    const { data } = await supabase
      .from("schools")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    return !!data;
  } catch (error) {
    console.error("Error in checkIsSchool:", error);
    return false;
  }
}

// 2. Get Parent Dashboard Stats
export async function getParentStats() {
  try {
    const user = await currentUser();
    if (!user) return null;

    // Get parent_id first
    const { data: parentData, error: parentError } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (parentError || !parentData) return null;

    // Use Redis cache for stats (2 minutes TTL for real-time feel)
    const cacheKey = `parent:stats:${parentData.parent_id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        // Get children data
        const { data: childrenData, error: childrenError } = await supabase
          .from("children")
          .select("child_id, total_posts, learning_hours")
          .eq("parent_id", parentData.parent_id);

        if (childrenError || !childrenData) return null;

        const childIds = childrenData.map((c) => c.child_id);

        // Parallel queries for better performance
        const [{ data: logsData }, { count: totalExams }] = await Promise.all([
          supabase
            .from("child_screen_logs")
            .select("seconds_spent, activity_type")
            .in("child_id", childIds),
          supabase
            .from("exam_attempts")
            .select("*", { count: "exact", head: true })
            .in("child_id", childIds)
            .eq("status", "SUBMITTED"),
        ]);

        const totalChildren = childrenData.length;
        const totalPosts = childrenData.reduce(
          (sum, child: any) => sum + (child.total_posts || 0),
          0,
        );

        // Learning hours: ONLY sum logs where activity_type is 'learning'
        const totalLearningSeconds =
          logsData
            ?.filter((log: any) => log.activity_type === "learning")
            .reduce((sum, log: any) => sum + (log.seconds_spent || 0), 0) || 0;
        const learningHours = totalLearningSeconds / 3600;

        // Activity hours: Sum up all seconds from all logs and convert to hours.
        const totalActivitySeconds =
          logsData?.reduce(
            (sum, log: any) => sum + (log.seconds_spent || 0),
            0,
          ) || 0;
        const activityHours = totalActivitySeconds / 3600;

        return {
          totalChildren,
          totalPosts,
          learningHours,
          activityHours,
          totalExams: totalExams || 0,
        };
      },
      120, // 2 minutes cache
    );
  } catch (error) {
    console.error("Error in getParentStats:", error);
    return null;
  }
}

export async function getParentProfile() {
  try {
    const user = await currentUser();
    if (!user) return null;

    // Cache parent profile for 5 minutes
    const cacheKey = `parent:profile:${user.id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from("parents")
          .select("*")
          .eq("clerk_id", user.id)
          .single();

        if (error) throw error;
        return data;
      },
      300, // 5 minutes
    );
  } catch (error) {
    console.error("Error in getParentProfile:", error);
    return null;
  }
}

// 3. Get Children List
export async function getMyChildren() {
  try {
    const user = await currentUser();
    if (!user) return [];

    // Get parent_id first
    const { data: parentData } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (!parentData) return [];

    // Cache children list for 2 minutes
    const cacheKey = `parent:children:${parentData.parent_id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        const { data } = await supabase
          .from("children")
          .select("*")
          .eq("parent_id", parentData.parent_id);

        return data || [];
      },
      120, // 2 minutes
    );
  } catch (error) {
    console.error("Error in getMyChildren:", error);
    return [];
  }
}

export async function getChildrenRecentPosts() {
  try {
    const user = await currentUser();
    if (!user) return [];

    const { data: parentData } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (!parentData) return [];

    // Cache recent posts for 1 minute
    const cacheKey = `parent:recent-posts:${parentData.parent_id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        const { data: children } = await supabase
          .from("children")
          .select("child_id")
          .eq("parent_id", parentData.parent_id);

        if (!children || children.length === 0) return [];

        const childIds = children.map((c) => c.child_id);

        const { data: posts, error } = await supabase
          .from("posts")
          .select(
            `
        *,
        child:children (
          name,
          username,
          avatar
        ),
        category:categories (
          name
        )
      `,
          )
          .in("child_id", childIds)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        return posts || [];
      },
      60, // 1 minute
    );
  } catch (error) {
    console.error("Error fetching children recent posts:", error);
    return [];
  }
}

export async function getChildrenRecentActivity() {
  try {
    const user = await currentUser();
    if (!user) return [];

    const { data: parentData } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (!parentData) return [];

    // Cache recent activity for 1 minute
    const cacheKey = `parent:recent-activity:${parentData.parent_id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        const { data: children } = await supabase
          .from("children")
          .select("child_id, name")
          .eq("parent_id", parentData.parent_id);

        if (!children || children.length === 0) return [];

        const childIds = children.map((c) => c.child_id);

        // Fetch multiple types of activities in parallel
        const [{ data: screenLogs }, { data: posts }] = await Promise.all([
          supabase
            .from("child_screen_logs")
            .select("child_id, updated_at, seconds_spent")
            .in("child_id", childIds)
            .order("updated_at", { ascending: false })
            .limit(5),
          supabase
            .from("posts")
            .select("child_id, created_at, title, caption")
            .in("child_id", childIds)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        // Map to a common format
        const activities: any[] = [];

        screenLogs?.forEach((log) => {
          const child = children.find((c) => c.child_id === log.child_id);
          activities.push({
            id: `log-${log.child_id}-${log.updated_at}`,
            childName: child?.name || "Child",
            action: "is active",
            detail: "Screen Time session",
            timestamp: log.updated_at,
            type: "screen",
          });
        });

        posts?.forEach((post) => {
          const child = children.find((c) => c.child_id === post.child_id);
          activities.push({
            id: `post-${post.child_id}-${post.created_at}`,
            childName: child?.name || "Child",
            action: "shared a new post",
            detail: post.title || post.caption || "Untitled",
            timestamp: post.created_at,
            type: "post",
          });
        });

        return activities
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 10);
      },
      60, // 1 minute
    );
  } catch (error) {
    console.error("Error fetching children recent activity:", error);
    return [];
  }
}

// 3b. Get Exam Results for Children
export async function getChildrenExamResults() {
  try {
    const user = await currentUser();
    if (!user) return null;

    // 1. Get parent_id
    const { data: parentData, error: parentError } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (parentError || !parentData) return null;

    // 2. Get children
    const { data: childrenData } = await supabase
      .from("children")
      .select("child_id")
      .eq("parent_id", parentData.parent_id);

    if (!childrenData || childrenData.length === 0) return [];

    const childIds = childrenData.map((c) => c.child_id);

    // 3. Get exam attempts for these children
    const { data: attempts, error: attemptsError } = await supabase
      .from("exam_attempts")
      .select(
        `
        *,
        child:children(name, username, avatar),
        exam:exams(title, subject, total_marks, pass_marks, school:schools(name, logo_url))
      `,
      )
      .in("child_id", childIds)
      .eq("status", "SUBMITTED")
      .order("submitted_at", { ascending: false });

    if (attemptsError) {
      console.error("Error fetching exam attempts:", attemptsError);
      return [];
    }

    return attempts;
  } catch (error) {
    console.error("Error in getChildrenExamResults:", error);
    return [];
  }
}

// 4. Get Single Child Details (Securely)
export async function getChildDetails(childId: string) {
  try {
    const user = await currentUser();
    if (!user) return null;

    // We don't cache this heavily or we cache it with user ID to ensure ownership
    // But for simplicity, we'll verify ownership inside the query

    // First get parent ID
    const { data: parentData } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (!parentData) return null;

    const { data: childData, error } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .eq("parent_id", parentData.parent_id) // Ensure child belongs to parent
      .single();

    if (error || !childData) {
      console.error("Error fetching child details:", error);
      return null;
    }

    return childData;
  } catch (error) {
    console.error("Error in getChildDetails:", error);
    return null;
  }
}

// 5. Invalidate Cache (Required by other components)
export async function invalidateParentCache(userId: string) {
  await invalidateCache(KEYS.PARENT_STATS(userId));
  await invalidateCache(KEYS.PARENT_CHILDREN(userId));
  await invalidateCache(KEYS.IS_PARENT(userId));
}

// 6. Toggle Child Focus Mode
export async function toggleChildFocusMode(childId: string, enabled: boolean) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Get parent ID to verify ownership
    const { data: parentData } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (!parentData) return { success: false, error: "Parent not found" };

    // 2. Update child focus_mode
    const { error } = await supabase
      .from("children")
      .update({ focus_mode: enabled })
      .eq("id", childId)
      .eq("parent_id", parentData.parent_id);

    if (error) {
      console.error("Error toggling focus mode:", error);
      return { success: false, error: "Failed to update focus mode" };
    }

    // Revalidate paths to clear Next.js router cache
    revalidatePath("/parent/dashboard");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error in toggleChildFocusMode:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 7. Update Child Screen Time Settings
export async function updateChildScreenTime(
  childId: string,
  limit: number | null,
  slots: string[],
) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Get parent ID to verify ownership
    const { data: parentData } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (!parentData) return { success: false, error: "Parent not found" };

    // 2. Update child screen_time_limit and allowed_time_slots
    const { error } = await supabase
      .from("children")
      .update({
        screen_time_limit: limit,
        allowed_time_slots: slots,
      })
      .eq("id", childId)
      .eq("parent_id", parentData.parent_id);

    if (error) {
      console.error("Error updating screen time:", error);
      return { success: false, error: "Failed to update screen time settings" };
    }

    // Revalidate paths to clear Next.js router cache
    revalidatePath("/parent/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error in updateChildScreenTime:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
