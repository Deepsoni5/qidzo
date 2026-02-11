"use server";

import { supabase } from "@/lib/supabaseClient";
import { invalidateCache } from "@/lib/redis";
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

    // Direct DB check - No caching for critical auth checks to prevent race conditions
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

// 2. Get Parent Dashboard Stats
export async function getParentStats() {
  try {
    const user = await currentUser();
    if (!user) return null;

    // Direct DB fetch to ensure real-time accuracy for parent dashboard
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

    // Direct DB fetch to ensure real-time accuracy for parent dashboard
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
