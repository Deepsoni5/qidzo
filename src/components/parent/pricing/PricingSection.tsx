"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Crown, Rocket, Sparkles, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createSubscription, getParentSubscriptionStatus, createOneTimeOrder, redeemCoupon } from "@/actions/razorpay";
import { toast } from "sonner";
import Script from "next/script";
import { supabase } from "@/lib/supabaseClient";

const plans = [
  {
    name: "Basic",
    id: "basic",
    price: { monthly: 99, yearly: 999 },
    originalPrice: { monthly: 149, yearly: 1490 },
    description: "Perfect for starting your kid's learning journey!",
    features: [
      "Limited website access",
      "Limited tutorial access",
      "Limited chatting",
      "Add 1 child profile",
      "Standard parent dashboard",
      "Weekly activity reports",
      "Downloaded reports"
    ],
    color: "brand-purple",
    icon: Rocket,
    comingSoon: false,
    recommended: false
  },
  {
    name: "Pro",
    id: "pro",
    price: { monthly: 299, yearly: 2999 },
    originalPrice: { monthly: 399, yearly: 3990 },
    description: "Advanced tools for growing explorers!",
    features: [
      "Everything in Basic",
      "Full website access",
      "Full Playzone access",
      "Exclusive Tutorial access",
      "Unlimited chatting",
      "Advanced parent dashboard",
      "Advanced AI learning insights",
      "Priority customer support",
      "Custom challenges for kids",
      "Ad-free experience"
    ],
    color: "sky-blue",
    icon: Zap,
    comingSoon: false,
    recommended: true
  },
  {
    name: "Elite",
    id: "elite",
    price: { monthly: 399, yearly: 3999 },
    originalPrice: { monthly: 599, yearly: 5990 },
    description: "The ultimate experience for super learners!",
    features: [
      "Everything in Pro",
      "Quarterly 1-on-1 expert session",
      "Exclusive Elite Badges",
      "Early Access to New Features",
      "Realtime 24*7 Customer Support",
      "Advanced AI-based Child Insights"
    ],
    color: "hot-pink",
    icon: Crown,
    comingSoon: false,
    recommended: false
  }
];

export default function PricingSection({ showTitle = true }: { showTitle?: boolean }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [parentStatus, setParentStatus] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [couponMessage, setCouponMessage] = useState("");
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      const status = await getParentSubscriptionStatus();
      setParentStatus(status);
    }
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!couponCode.trim()) {
      setCouponStatus("idle");
      setCouponMessage("");
      return;
    }

    let active = true;
    setCouponStatus("checking");
    setCouponMessage("");

    const handle = setTimeout(async () => {
      const code = couponCode.trim().toUpperCase();
      try {
        const { data, error } = await supabase
          .from("coupon_codes")
          .select("*")
          .eq("code", code)
          .limit(1)
          .maybeSingle();

        if (!active) return;

        if (error) {
          setCouponStatus("invalid");
          setCouponMessage("Could not verify this code right now.");
          return;
        }

        if (!data) {
          setCouponStatus("invalid");
          setCouponMessage("No such magic code found.");
          return;
        }

        if (!data.is_active) {
          setCouponStatus("invalid");
          setCouponMessage("This code is not active.");
          return;
        }

        const now = new Date();

        if (data.valid_from && new Date(data.valid_from) > now) {
          setCouponStatus("invalid");
          setCouponMessage("This code is not live yet.");
          return;
        }

        if (data.valid_until && new Date(data.valid_until) < now) {
          setCouponStatus("invalid");
          setCouponMessage("This code has expired.");
          return;
        }

        if (data.max_global_uses !== null && data.used_count >= data.max_global_uses) {
          setCouponStatus("invalid");
          setCouponMessage("All uses for this code have been claimed.");
          return;
        }

        setCouponStatus("valid");
        const target = data.target_plan;
        if (target === "ALL") {
          setCouponMessage("Valid magic code for any upgrade or Add Kid.");
        } else if (target === "BASIC") {
          setCouponMessage("Valid magic code for Basic plan.");
        } else if (target === "PRO") {
          setCouponMessage("Valid magic code for Pro plan.");
        } else if (target === "ELITE") {
          setCouponMessage("Valid magic code for Elite plan.");
        } else if (target === "ADD_KID") {
          setCouponMessage("Valid magic code for Add Kid slot.");
        } else {
          setCouponMessage("Valid magic code.");
        }
      } catch {
        if (!active) return;
        setCouponStatus("invalid");
        setCouponMessage("Something went wrong while checking this code.");
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [couponCode]);

  const handleUpgrade = async (planId: string) => {
    setIsLoading(planId);
    try {
      const currentPlan = (parentStatus?.subscription_plan as string | undefined) || undefined;
      const targetUpper = planId.toUpperCase();

      if (currentPlan === targetUpper) {
        const result = await createOneTimeOrder();
        if (!result.success) { toast.error(result.error); return; }
        const options = {
          key: result.keyId,
          amount: result.amount,
          currency: "INR",
          name: "Qidzo",
          description: "Add 1 Child Profile Slot",
          order_id: result.orderId,
          handler: () => {
            toast.success("Slot Purchased! 🎉");
            setTimeout(() => { window.location.reload(); }, 2000);
          },
          prefill: { name: result.parentName, email: result.parentEmail, contact: result.parentPhone },
          theme: { color: "#8B5CF6" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }
      const result = await createSubscription(planId as "basic" | "pro" | "elite", billingCycle);
      if (!result.success) { toast.error(result.error); return; }
      const options = {
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "Qidzo",
        description: `Qidzo ${targetUpper.charAt(0)}${targetUpper.slice(1).toLowerCase()} (${billingCycle})`,
        handler: () => {
          toast.success("Payment Successful! 🎉");
          setTimeout(() => { window.location.reload(); }, 2000);
        },
        prefill: { name: result.parentName, email: result.parentEmail, contact: result.parentPhone },
        theme: { color: "#8B5CF6" }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Something went wrong with the payment.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (couponStatus !== "valid" || !couponCode.trim() || isRedeemingCoupon) {
      return;
    }
    setIsRedeemingCoupon(true);
    try {
      const result = await redeemCoupon(couponCode.trim().toUpperCase());
      if (!result?.success) {
        toast.error(result?.error || "Could not apply this code.");
        return;
      }

      if (result.type === "PLAN") {
        const planLabel =
          result.plan === "BASIC"
            ? "Basic"
            : result.plan === "PRO"
            ? "Pro"
            : result.plan === "ELITE"
            ? "Elite"
            : "your";

        toast.success(
          `Congratulations! You now have ${planLabel} plan for free for 1 month.`
        );

        setParentStatus((prev: any) => ({
          ...(prev || {}),
          subscription_plan: result.plan,
          subscription_status: "ACTIVE",
          max_children_slots: result.maxChildrenSlots ?? (prev?.max_children_slots || 0),
        }));
      } else if (result.type === "ADD_KID") {
        toast.success("Yay! You got 1 extra kid slot for free.");
        setParentStatus((prev: any) => ({
          ...(prev || {}),
          max_children_slots: (prev?.max_children_slots || 0) + 1,
        }));
      }

      setCouponCode("");
    } catch {
      toast.error("Something went wrong while applying this code.");
    } finally {
      setIsRedeemingCoupon(false);
    }
  };

  return (
    <div className="w-full">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {showTitle && (
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 text-brand-purple rounded-full text-sm font-black uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Level Up Your Experience
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black font-nunito text-gray-900"
          >
            Choose the Perfect Plan
          </motion.h2>
        </div>
      )}

      {/* Billing Toggle + Coupon */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
        <div className="bg-gray-100 p-1.5 rounded-[24px] flex items-center relative shadow-inner border-2 border-gray-200">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "relative z-10 px-8 py-3 rounded-[20px] text-sm font-black transition-all duration-300 cursor-pointer",
              billingCycle === "monthly" ? "text-white" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "relative z-10 px-8 py-3 rounded-[20px] text-sm font-black transition-all duration-300 cursor-pointer",
              billingCycle === "yearly" ? "text-white" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Yearly
            <span className="absolute -top-3 -right-4 bg-hot-pink text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg rotate-12">
              Save 15%
            </span>
          </button>
          <motion.div
            layoutId="toggle"
            className="absolute bg-brand-purple rounded-[20px] shadow-lg shadow-brand-purple/30 h-[calc(100%-12px)] w-[calc(50%-6px)]"
            animate={{ x: billingCycle === "monthly" ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="w-full md:w-auto">
          <div className="bg-white border-2 border-dashed border-brand-purple/20 rounded-2xl px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-purple" />
              <span className="text-[11px] font-black text-gray-700 uppercase tracking-[0.18em]">
                Have a magic code?
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 sm:w-40 md:w-48 px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-0 text-xs font-bold text-gray-800 bg-gray-50/60"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponStatus !== "valid" || isRedeemingCoupon}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.18em] flex items-center justify-center gap-1 shadow-sm",
                  couponStatus === "valid" && !isRedeemingCoupon
                    ? "bg-brand-purple text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                )}
              >
                {isRedeemingCoupon ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Apply"
                )}
              </button>
              <div className="min-w-[70px] flex items-center justify-end text-[11px] font-black">
                {couponStatus === "checking" && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking…</span>
                  </div>
                )}
                {couponStatus === "valid" && !isRedeemingCoupon && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Valid
                  </span>
                )}
                {couponStatus === "invalid" && (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                    Invalid
                  </span>
                )}
              </div>
            </div>
            {couponMessage && (
              <p
                className={cn(
                  "text-[10px] font-bold mt-1 sm:mt-0",
                  couponStatus === "valid" ? "text-emerald-600" : "text-red-500"
                )}
              >
                {couponMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className={cn(
              "relative bg-white rounded-[40px] p-8 border-4 transition-all duration-500 hover:shadow-2xl flex flex-col h-full overflow-hidden",
              plan.recommended ? "border-brand-purple shadow-xl shadow-brand-purple/10" : "border-gray-100 hover:border-gray-200"
            )}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-brand-purple text-white px-6 py-2 rounded-bl-3xl font-black text-xs uppercase tracking-widest shadow-md">
                Recommended
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-8">
              <div className={cn(
                "w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-lg",
                `bg-${plan.color}/10`
              )}>
                <plan.icon className={cn("w-8 h-8", `text-${plan.color}`)} />
              </div>
              <h3 className="text-2xl font-black font-nunito text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-500 font-bold text-sm leading-relaxed">{plan.description}</p>
            </div>

            {/* Pricing */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-gray-400 text-xl font-bold line-through decoration-hot-pink decoration-2">
                  ₹{plan.originalPrice[billingCycle]}
                </span>
                <span className="text-4xl font-black text-gray-900 font-nunito">₹{plan.price[billingCycle]}</span>
                <span className="text-gray-500 font-bold">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                    `bg-${plan.color}/10 text-${plan.color}`
                  )}>
                    <Check className="w-3 h-3 stroke-[4]" />
                  </div>
                  <span className="text-gray-600 font-bold text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            {plan.comingSoon ? (
              <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-center uppercase tracking-widest border-2 border-gray-200">
                Coming Soon
              </div>
            ) : (
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isLoading !== null}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50",
                  `bg-${plan.color} text-white shadow-${plan.color}/20 hover:scale-[1.02]`
                )}
              >
                {isLoading === plan.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {parentStatus?.subscription_plan === plan.id.toUpperCase()
                      ? "Add More Kid"
                      : "Upgrade"}
                    <Star className="w-5 h-5 fill-white" />
                  </>
                )}
              </button>
            )}
            
            {/* Background Accent */}
            <div className={cn(
              "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10",
              `bg-${plan.color}`
            )} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
