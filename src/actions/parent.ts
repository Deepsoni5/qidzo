"use server";

import { supabase } from "@/lib/supabaseClient";
import { getOrSetCache, invalidateCache } from "@/lib/redis";
import { currentUser } from "@clerk/nextjs/server";

// Cache Keys
const KEYS = {
  IS_PARENT: (userId: string) => `user:role:parent:${userId}`,
  PARENT_STATS: (userId: string) => `parent:stats:${userId}`,
  PARENT_CHILDREN: (userId: string) => `parent:children:${userId}`,
};

// 1. Check if User is Parent
export async function checkIsParent() {
  const user = await currentUser();
  if (!user) return false;

  return getOrSetCache(
    KEYS.IS_PARENT(user.id),
    async () => {
      const { data } = await supabase
        .from("parents")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      return !!data;
    },
    3600 // 1 hour cache
  );
}

// 2. Get Parent Dashboard Stats
export async function getParentStats() {
  const user = await currentUser();
  if (!user) return null;

  return getOrSetCache(
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
}

// 3. Get Children List
export async function getMyChildren() {
  const user = await currentUser();
  if (!user) return [];

  return getOrSetCache(
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
}

// 4. Invalidate Cache (Call this when data changes)
export async function invalidateParentCache(userId: string) {
  await invalidateCache(KEYS.PARENT_STATS(userId));
  await invalidateCache(KEYS.PARENT_CHILDREN(userId));
  // Note: IS_PARENT rarely changes, so we might not need to invalidate it often
}
