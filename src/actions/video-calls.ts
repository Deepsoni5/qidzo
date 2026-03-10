"use server";

import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "./auth";

/**
 * Check if the current child can make video/audio calls with another child
 * Requirements:
 * 1. Both children must have PRO or ELITE plans
 * 2. Both children must follow each other (mutual following)
 */
export async function canMakeVideoCalls(otherChildId?: string): Promise<{
  canCall: boolean;
  reason?: string;
}> {
  try {
    const childSession = await getChildSession();

    if (!childSession || !childSession.id) {
      return { canCall: false, reason: "Not authenticated" };
    }

    const currentChildId = childSession.id;

    // 1. Check current child's parent plan
    const { data: currentChildRow } = await supabase
      .from("children")
      .select("parent_id")
      .eq("child_id", currentChildId)
      .single();

    if (!currentChildRow?.parent_id) {
      return { canCall: false, reason: "Parent not found" };
    }

    const { data: currentParentRow } = await supabase
      .from("parents")
      .select("subscription_plan")
      .eq("parent_id", currentChildRow.parent_id)
      .single();

    const currentPlan = (
      currentParentRow?.subscription_plan || "FREE"
    ).toUpperCase();

    // Check if current child has PRO or ELITE
    if (currentPlan !== "PRO" && currentPlan !== "ELITE") {
      return {
        canCall: false,
        reason: "Upgrade to PRO or ELITE plan to make video calls",
      };
    }

    // If no other child specified, just check current child's plan
    if (!otherChildId) {
      return { canCall: true };
    }

    // 2. Check other child's parent plan
    const { data: otherChildRow } = await supabase
      .from("children")
      .select("parent_id")
      .eq("child_id", otherChildId)
      .single();

    if (!otherChildRow?.parent_id) {
      return {
        canCall: false,
        reason: "Cannot verify other user's plan",
      };
    }

    const { data: otherParentRow } = await supabase
      .from("parents")
      .select("subscription_plan")
      .eq("parent_id", otherChildRow.parent_id)
      .single();

    const otherPlan = (
      otherParentRow?.subscription_plan || "FREE"
    ).toUpperCase();

    // Check if other child has PRO or ELITE
    if (otherPlan !== "PRO" && otherPlan !== "ELITE") {
      return {
        canCall: false,
        reason: "Both users need PRO or ELITE plans for video calls",
      };
    }

    // 3. Check mutual following
    const { data: followingData } = await supabase
      .from("follows")
      .select("follower_child_id, following_child_id")
      .or(
        `and(follower_child_id.eq.${currentChildId},following_child_id.eq.${otherChildId}),and(follower_child_id.eq.${otherChildId},following_child_id.eq.${currentChildId})`,
      );

    if (!followingData || followingData.length < 2) {
      return {
        canCall: false,
        reason: "Both users must follow each other to make video calls",
      };
    }

    // All conditions met
    return { canCall: true };
  } catch (error) {
    console.error("Error checking video call permission:", error);
    return { canCall: false, reason: "Error checking permissions" };
  }
}
