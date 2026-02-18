import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    console.log("Razorpay Webhook Event:", event);

    if (event === "subscription.activated" || event === "subscription.charged") {
      const subscription = payload.payload.subscription.entity;
      const notes = subscription.notes;
      const parentId = notes.parent_id;
      const planType = notes.plan_type;

      if (!parentId) {
        return NextResponse.json({ error: "Missing parent_id in notes" }, { status: 400 });
      }

      const isActivationEvent = event === "subscription.activated";

      const { data: parent, error: fetchParentError } = await supabase
        .from("parents")
        .select("max_children_slots")
        .eq("parent_id", parentId)
        .single();

      if (fetchParentError) {
        console.error("Error fetching parent for subscription update:", fetchParentError);
      }

      const currentSlots = parent?.max_children_slots ?? 0;
      const newSlots = isActivationEvent ? currentSlots + 1 : currentSlots || 1;

      const now = new Date();
      const endDate = new Date(now);
      if (planType === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const envIds = {
        BASIC_MONTHLY: process.env.RAZORPAY_BASIC_MONTHLY_PLAN_ID,
        BASIC_YEARLY: process.env.RAZORPAY_BASIC_YEARLY_PLAN_ID,
        PRO_MONTHLY: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
        PRO_YEARLY: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID,
        ELITE_MONTHLY: process.env.RAZORPAY_ELITE_MONTHLY_PLAN_ID,
        ELITE_YEARLY: process.env.RAZORPAY_ELITE_YEARLY_PLAN_ID,
      };

      const planId = subscription.plan_id as string;
      let planUpper: "BASIC" | "PRO" | "ELITE" = "BASIC";
      if (planId === envIds.PRO_MONTHLY || planId === envIds.PRO_YEARLY) {
        planUpper = "PRO";
      } else if (planId === envIds.ELITE_MONTHLY || planId === envIds.ELITE_YEARLY) {
        planUpper = "ELITE";
      } else {
        planUpper = "BASIC";
      }

      const { error } = await supabase
        .from("parents")
        .update({
          subscription_plan: planUpper,
          subscription_status: "ACTIVE",
          max_children_slots: newSlots,
          razorpay_subscription_id: subscription.id,
          razorpay_customer_id: subscription.customer_id,
          subscription_interval: planType,
          subscription_ends_at: endDate.toISOString(),
          razorpay_plan_id: subscription.plan_id
        })
        .eq("parent_id", parentId);

      if (error) {
        console.error("Error updating parent subscription:", error);
        return NextResponse.json({ error: "DB Update Failed" }, { status: 500 });
      }

      console.log(`Successfully upgraded parent ${parentId} to ${planUpper}`);
    }

    // Handle One-time Payment (Add More Kid)
    if (event === "order.paid" || event === "payment.captured") {
      const entity = event === "order.paid" ? payload.payload.order.entity : payload.payload.payment.entity;
      const notes = entity.notes;

      console.log("Processing one-time payment for notes:", notes);

      if (notes?.type === "add_child_slot") {
        const parentId = notes.parent_id;
        
        if (!parentId) {
          console.error("Missing parent_id in one-time payment notes");
          return NextResponse.json({ error: "Missing parent_id" }, { status: 400 });
        }

        // INCREMENT SLOTS MANUALLY WITHOUT RPC
        console.log(`Incrementing slots for parent: ${parentId}`);
        
        // 1. Fetch current slots
        const { data: parent, error: fetchError } = await supabase
          .from("parents")
          .select("max_children_slots")
          .eq("parent_id", parentId)
          .single();
        
        if (fetchError) {
          console.error("Fetch current slots failed:", fetchError);
          return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
        }

        const currentSlots = parent?.max_children_slots || 0;
        const newSlots = currentSlots + 1;

        // 2. Update with new value
        const { error: updateError } = await supabase
          .from("parents")
          .update({ max_children_slots: newSlots })
          .eq("parent_id", parentId);
        
        if (updateError) {
          console.error("Manual update failed:", updateError);
          return NextResponse.json({ error: "Update failed" }, { status: 500 });
        }

        console.log(`Successfully incremented slots: ${currentSlots} -> ${newSlots} for parent ${parentId}`);
      }
    }

    // Handle cancellation
    if (event === "subscription.cancelled" || event === "subscription.halted") {
      const subscription = payload.payload.subscription.entity;
      const parentId = subscription.notes.parent_id;

      await supabase
        .from("parents")
        .update({
          subscription_plan: "FREE",
          subscription_status: "CANCELLED",
          max_children_slots: 0 // Revoke slots on cancellation
        })
        .eq("parent_id", parentId);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
