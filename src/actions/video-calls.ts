"use server";

import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "./auth";

/**
 * Check if the current child's parent has a plan that allows video/audio calls
 * Video/Audio calls are only available for PRO and ELITE plans
 */
export async function canMakeVideoCalls(): Promise<boolean> {
  try {
    const childSession = await getChildSession();

    if (!childSession || !childSession.id) {
      return false;
    }

    // 1. Fetch parent's ID for the current child
    const { data: childRow } = await supabase
      .from("children")
      .select("parent_id")
      .eq("child_id", childSession.id)
      .single();

    if (!childRow?.parent_id) {
      return false;
    }

    // 2. Fetch parent's subscription plan
    const { data: parentRow } = await supabase
      .from("parents")
      .select("subscription_plan")
      .eq("parent_id", childRow.parent_id)
      .single();

    const planUpper = (parentRow?.subscription_plan || "FREE").toUpperCase();

    // Video/Audio calls are only available for PRO and ELITE plans
    return planUpper === "PRO" || planUpper === "ELITE";
  } catch (error) {
    console.error("Error checking video call permission:", error);
    return false;
  }
}
