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

      // Update parent subscription in DB
      const { error } = await supabase
        .from("parents")
        .update({
          subscription_plan: "BASIC",
          subscription_status: "ACTIVE",
          max_children_slots: 1, // Basic plan grants 1 slot
          razorpay_subscription_id: subscription.id,
          razorpay_customer_id: subscription.customer_id,
          subscription_interval: planType,
          razorpay_plan_id: subscription.plan_id
        })
        .eq("parent_id", parentId);

      if (error) {
        console.error("Error updating parent subscription:", error);
        return NextResponse.json({ error: "DB Update Failed" }, { status: 500 });
      }

      console.log(`Successfully upgraded parent ${parentId} to BASIC`);
    }

    // Handle One-time Payment (Add More Kid)
    if (event === "order.paid") {
      const order = payload.payload.order.entity;
      const notes = order.notes;

      if (notes.type === "add_child_slot") {
        const parentId = notes.parent_id;

        // Increment max_children_slots by 1
        const { error } = await supabase.rpc('increment_child_slots', { 
          p_id: parentId 
        });

        if (error) {
          // Fallback if RPC doesn't exist yet
          const { data: parent } = await supabase
            .from("parents")
            .select("max_children_slots")
            .eq("parent_id", parentId)
            .single();
          
          await supabase
            .from("parents")
            .update({ max_children_slots: (parent?.max_children_slots || 0) + 1 })
            .eq("parent_id", parentId);
        }
        
        console.log(`Successfully added slot to parent ${parentId}`);
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
