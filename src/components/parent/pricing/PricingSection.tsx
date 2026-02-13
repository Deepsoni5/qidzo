"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Crown, Rocket, Sparkles, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createSubscription, getParentSubscriptionStatus, createOneTimeOrder } from "@/actions/razorpay";
import { toast } from "sonner";
import Script from "next/script";

const plans = [
  {
    name: "Basic",
    id: "basic",
    price: { monthly: 99, yearly: 999 },
    originalPrice: { monthly: 149, yearly: 1490 },
    description: "Perfect for starting your kid's learning journey!",
    features: [
      "Full Playzone access 🎮",
      "Exclusive Tutorial access 📚",
      "Set Screen Time limits ⏰",
      "Specific hour restrictions 🕒",
      "Add 1 child profile",
      "Standard parent dashboard",
      "Daily activity reports"
    ],
    color: "brand-purple",
    icon: Rocket,
    comingSoon: false,
    recommended: true
  },
  {
    name: "Pro",
    id: "pro",
    price: { monthly: 199, yearly: 1999 },
    originalPrice: { monthly: 299, yearly: 2990 },
    description: "Advanced tools for growing explorers!",
    features: [
      "Everything in Basic",
      "Manage up to 5 child accounts",
      "Advanced AI learning insights",
      "Priority parent support",
      "Custom challenges for kids",
      "Ad-free experience"
    ],
    color: "sky-blue",
    icon: Zap,
    comingSoon: true,
    recommended: false
  },
  {
    name: "Elite",
    id: "elite",
    price: { monthly: 399, yearly: 3999 },
    originalPrice: { monthly: 599, yearly: 5990 },
    description: "The ultimate experience for super learners!",
    features: [
      "Everything in Pro",
      "Unlimited child accounts",
      "1-on-1 expert consultation",
      "Early access to new features",
      "Exclusive Elite badges & themes",
      "Family learning workshops"
    ],
    color: "hot-pink",
    icon: Crown,
    comingSoon: true,
    recommended: false
  }
];

export default function PricingSection({ showTitle = true }: { showTitle?: boolean }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [parentStatus, setParentStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchStatus() {
      const status = await getParentSubscriptionStatus();
      setParentStatus(status);
    }
    fetchStatus();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId !== "basic") return;
    setIsLoading(planId);
    try {
      if (parentStatus?.subscription_plan === "BASIC") {
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
      const result = await createSubscription(billingCycle);
      if (!result.success) { toast.error(result.error); return; }
      const options = {
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "Qidzo",
        description: `Qidzo Basic (${billingCycle})`,
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

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
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
              <p className="text-xs font-black text-hot-pink uppercase tracking-wider mt-1">Recurring Billing</p>
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
                    {plan.id === "basic" && parentStatus?.subscription_plan === "BASIC" 
                      ? "Add More Kid" 
                      : "Upgrade"
                    }
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
