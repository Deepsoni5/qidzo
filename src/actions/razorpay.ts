"use server";

import { razorpay } from "@/lib/razorpay";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";

export async function createSubscription(planType: "monthly" | "yearly") {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const { data: parent, error: parentError } = await supabase
      .from("parents")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (parentError || !parent) throw new Error("Parent profile not found");

    const planId =
      planType === "monthly"
        ? process.env.RAZORPAY_BASIC_MONTHLY_PLAN_ID
        : process.env.RAZORPAY_BASIC_YEARLY_PLAN_ID;

    if (!planId) throw new Error("Razorpay Plan ID not configured in environment variables");

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: planType === "monthly" ? 120 : 10,
      quantity: 1,
      customer_notify: 1,
      notes: {
        parent_id: parent.parent_id,
        clerk_id: user.id,
        plan_type: planType,
      },
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      parentName: parent.name,
      parentEmail: parent.email,
      parentPhone: parent.phone,
    };
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return { success: false, error: error.message };
  }
}

export async function createOneTimeOrder() {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const { data: parent } = await supabase
      .from("parents")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (!parent) throw new Error("Parent profile not found");

    const amount = parseInt(process.env.RAZORPAY_ADD_CHILD_PRICE || "99");

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_add_child_${Date.now()}`,
      notes: {
        parent_id: parent.parent_id,
        clerk_id: user.id,
        type: "add_child_slot",
      },
    });

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      parentName: parent.name,
      parentEmail: parent.email,
      parentPhone: parent.phone,
    };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message };
  }
}

export async function getParentSubscriptionStatus() {
  try {
    const user = await currentUser();
    if (!user) return null;

    const { data } = await supabase
      .from("parents")
      .select("subscription_plan, subscription_status, max_children_slots")
      .eq("clerk_id", user.id)
      .single();

    return data;
  } catch (error) {
    return null;
  }
}

export async function redeemCoupon(code: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: parent, error: parentError } = await supabase
      .from("parents")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (parentError || !parent) {
      return { success: false, error: "Parent profile not found" };
    }

    const normalizedCode = code.trim().toUpperCase();

    const { data: coupon, error: couponError } = await supabase
      .from("coupon_codes")
      .select("*")
      .eq("code", normalizedCode)
      .limit(1)
      .maybeSingle();

    if (couponError) {
      return { success: false, error: "Could not verify this code right now" };
    }

    if (!coupon) {
      return { success: false, error: "No such magic code found" };
    }

    if (!coupon.is_active) {
      return { success: false, error: "This code is not active" };
    }

    const now = new Date();

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { success: false, error: "This code is not live yet" };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { success: false, error: "This code has expired" };
    }

    if (coupon.max_global_uses !== null && coupon.used_count >= coupon.max_global_uses) {
      return { success: false, error: "All uses for this code have been claimed" };
    }

    const targetPlan = coupon.target_plan as string | null;
    const parentPlan = (parent.subscription_plan as string | null) || null;

    if (targetPlan === "ADD_KID") {
      if (!parentPlan || parentPlan.toUpperCase() === "FREE") {
        return {
          success: false,
          error: "You must need a Basic plan to redeem this coupon",
        };
      }

      const newSlots = (parent.max_children_slots || 0) + 1;

      const { error: updateParentError } = await supabase
        .from("parents")
        .update({
          max_children_slots: newSlots,
        })
        .eq("parent_id", parent.parent_id);

      if (updateParentError) {
        return { success: false, error: "Failed to update parent profile" };
      }

      const nextUses = (coupon.used_count || 0) + 1;
      const reachedLimit =
        coupon.max_global_uses !== null && nextUses >= coupon.max_global_uses;

      const { error: updateCouponError } = await supabase
        .from("coupon_codes")
        .update({
          used_count: nextUses,
          is_active: reachedLimit ? false : coupon.is_active,
        })
        .eq("id", coupon.id);

      if (updateCouponError) {
        return { success: false, error: "Failed to update coupon usage" };
      }

      return {
        success: true,
        type: "ADD_KID",
      };
    }

    if (!targetPlan) {
      return { success: false, error: "This magic code is not linked to a plan" };
    }

    const planUpper = targetPlan.toUpperCase();

    if (!["BASIC", "PRO", "ELITE"].includes(planUpper)) {
      return { success: false, error: "This magic code cannot be redeemed right now" };
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const currentSlots = parent.max_children_slots || 0;
    const newSlots = currentSlots + 1;

    const parentUpdate: Record<string, any> = {
      subscription_plan: planUpper,
      subscription_status: "ACTIVE",
      subscription_interval: "monthly",
      subscription_ends_at: endDate.toISOString(),
      max_children_slots: newSlots,
    };

    if (planUpper === "BASIC") {
      const basicMonthlyPlanId = process.env.RAZORPAY_BASIC_MONTHLY_PLAN_ID || null;
      parentUpdate.razorpay_plan_id = basicMonthlyPlanId;
    }

    const { error: parentUpdateError } = await supabase
      .from("parents")
      .update(parentUpdate)
      .eq("parent_id", parent.parent_id);

    if (parentUpdateError) {
      return { success: false, error: "Failed to update parent subscription" };
    }

    const nextUses = (coupon.used_count || 0) + 1;
    const reachedLimit =
      coupon.max_global_uses !== null && nextUses >= coupon.max_global_uses;

    const { error: couponUpdateError } = await supabase
      .from("coupon_codes")
      .update({
        used_count: nextUses,
        is_active: reachedLimit ? false : coupon.is_active,
      })
      .eq("id", coupon.id);

    if (couponUpdateError) {
      return { success: false, error: "Failed to update coupon usage" };
    }

    return {
      success: true,
      type: "PLAN",
      plan: planUpper,
      endsAt: endDate.toISOString(),
      maxChildrenSlots: newSlots,
    };
  } catch (error: any) {
    console.error("Error redeeming coupon:", error);
    return { success: false, error: "Something went wrong while redeeming this code" };
  }
}
