"use server";

import { razorpay } from "@/lib/razorpay";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";

export async function createSubscription(planType: 'monthly' | 'yearly') {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Get Parent Data
    const { data: parent, error: parentError } = await supabase
      .from("parents")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (parentError || !parent) throw new Error("Parent profile not found");

    // 2. Select Plan ID from Env
    const planId = planType === 'monthly' 
      ? process.env.RAZORPAY_BASIC_MONTHLY_PLAN_ID 
      : process.env.RAZORPAY_BASIC_YEARLY_PLAN_ID;

    if (!planId) throw new Error("Razorpay Plan ID not configured in environment variables");

    // 3. Create Razorpay Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: planType === 'monthly' ? 120 : 10, // 10 years or 120 months
      quantity: 1,
      customer_notify: 1,
      notes: {
        parent_id: parent.parent_id,
        clerk_id: user.id,
        plan_type: planType
      }
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      parentName: parent.name,
      parentEmail: parent.email,
      parentPhone: parent.phone
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
      amount: amount * 100, // Razorpay works in paise
      currency: "INR",
      receipt: `receipt_add_child_${Date.now()}`,
      notes: {
        parent_id: parent.parent_id,
        clerk_id: user.id,
        type: "add_child_slot"
      }
    });

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      parentName: parent.name,
      parentEmail: parent.email,
      parentPhone: parent.phone
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
