"use server";

import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "./auth";

/**
 * Check if current child can create groups (PRO/ELITE only)
 */
export async function canCreateGroup(): Promise<{
  canCreate: boolean;
  reason?: string;
  currentPlan?: string;
}> {
  try {
    const childSession = await getChildSession();
    if (!childSession || !childSession.id) {
      return { canCreate: false, reason: "Not authenticated" };
    }

    const { data: child } = await supabase
      .from("children")
      .select("parent_id")
      .eq("child_id", childSession.id)
      .single();

    if (!child?.parent_id) {
      return { canCreate: false, reason: "Parent not found" };
    }

    const { data: parent } = await supabase
      .from("parents")
      .select("subscription_plan")
      .eq("parent_id", child.parent_id)
      .single();

    const plan = (parent?.subscription_plan || "FREE").toUpperCase();

    if (plan !== "PRO" && plan !== "ELITE") {
      return {
        canCreate: false,
        reason: "Upgrade to PRO or ELITE to create groups",
        currentPlan: plan,
      };
    }

    return { canCreate: true, currentPlan: plan };
  } catch (error) {
    console.error("Error checking group creation permission:", error);
    return { canCreate: false, reason: "Error checking permissions" };
  }
}

/**
 * Get list of children that current user is following (for group member selection)
 */
export async function getFollowingForGroup(): Promise<{
  success: boolean;
  following?: Array<{
    child_id: string;
    name: string;
    username: string;
    avatar: string | null;
    age: number | null;
    country: string | null;
  }>;
  error?: string;
}> {
  try {
    const childSession = await getChildSession();
    if (!childSession || !childSession.id) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        following_child_id,
        children:following_child_id (
          child_id,
          name,
          username,
          avatar,
          age,
          country
        )
      `,
      )
      .eq("follower_child_id", childSession.id);

    if (error) {
      console.error("Error fetching following:", error);
      return { success: false, error: "Failed to load following list" };
    }

    // Transform the data
    const following = (data || [])
      .map((item: any) => item.children)
      .filter(Boolean);

    return { success: true, following };
  } catch (error) {
    console.error("Error getting following for group:", error);
    return { success: false, error: "Something went wrong" };
  }
}

/**
 * Validate group creation data
 */
export async function validateGroupCreation(
  groupName: string,
  memberIds: string[],
): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const childSession = await getChildSession();
    if (!childSession || !childSession.id) {
      return { valid: false, error: "Not authenticated" };
    }

    // Check permission
    const permission = await canCreateGroup();
    if (!permission.canCreate) {
      return { valid: false, error: permission.reason };
    }

    // Validate group name
    if (!groupName || groupName.trim().length === 0) {
      return { valid: false, error: "Group name is required" };
    }

    if (groupName.trim().length < 3) {
      return {
        valid: false,
        error: "Group name must be at least 3 characters",
      };
    }

    if (groupName.trim().length > 50) {
      return {
        valid: false,
        error: "Group name must be less than 50 characters",
      };
    }

    // Validate members
    if (!memberIds || memberIds.length === 0) {
      return { valid: false, error: "Please select at least one member" };
    }

    if (memberIds.length > 50) {
      return { valid: false, error: "Maximum 50 members allowed per group" };
    }

    // Verify all members are in following list
    const { following } = await getFollowingForGroup();
    if (!following) {
      return { valid: false, error: "Failed to verify members" };
    }

    const followingIds = following.map((f) => f.child_id);
    const invalidMembers = memberIds.filter((id) => !followingIds.includes(id));

    if (invalidMembers.length > 0) {
      return {
        valid: false,
        error: "You can only add children you are following",
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error validating group creation:", error);
    return { valid: false, error: "Validation failed" };
  }
}
