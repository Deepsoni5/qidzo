"use server";

import { supabase } from "@/lib/supabaseClient";
import { getOrSetCache, invalidateCache } from "@/lib/redis";
import { currentUser } from "@clerk/nextjs/server";

// Cache Keys
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

    // Direct DB check - No caching for critical auth checks to prevent race conditions
    const { data } = await supabase
        .from("parents")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
    
    return !!data;
  } catch (error) {
    console.error("Error in checkIsParent:", error);
    return false;
  }
}

// 2. Get Parent Dashboard Stats
export async function getParentStats() {
  try {
    const user = await currentUser();
    if (!user) return null;

    return await getOrSetCache(
      KEYS.PARENT_STATS(user.id),
      async () => {
        // 1. Get parent_id
        const { data: parentData, error: parentError } = await supabase
          .from("parents")
          .select("parent_id")
          .eq("clerk_id", user.id)
          .single();

        if (parentError || !parentData) return null;

        // 2. Get children stats
        const { data: childrenData, error: childrenError } = await supabase
          .from("children")
          .select("total_posts, learning_hours")
          .eq("parent_id", parentData.parent_id);

        if (childrenError || !childrenData) return null;

        const totalChildren = childrenData.length;
        const totalPosts = childrenData.reduce((sum, child: any) => sum + (child.total_posts || 0), 0);
        const learningHours = childrenData.reduce((sum, child: any) => sum + (child.learning_hours || 0), 0);

        return {
          totalChildren,
          totalPosts,
          learningHours
        };
      },
      600 // 10 minutes cache
    );
  } catch (error) {
    console.error("Error in getParentStats:", error);
    return null;
  }
}

// 3. Get Children List
export async function getMyChildren() {
  try {
    const user = await currentUser();
    if (!user) return [];

    return await getOrSetCache(
      KEYS.PARENT_CHILDREN(user.id),
      async () => {
        const { data: parentData } = await supabase
          .from("parents")
          .select("parent_id")
          .eq("clerk_id", user.id)
          .single();

        if (!parentData) return [];

        const { data } = await supabase
          .from("children")
          .select("*")
          .eq("parent_id", parentData.parent_id);

        return data || [];
      },
      600 // 10 minutes cache
    );
  } catch (error) {
    console.error("Error in getMyChildren:", error);
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

// 5. Invalidate Cache (Call this when data changes)
export async function invalidateParentCache(userId: string) {
  await invalidateCache(KEYS.PARENT_STATS(userId));
  await invalidateCache(KEYS.PARENT_CHILDREN(userId));
  await invalidateCache(KEYS.IS_PARENT(userId));
}
