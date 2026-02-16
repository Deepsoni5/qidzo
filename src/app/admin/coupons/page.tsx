"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  TicketPercent,
  Sparkles,
  Calendar,
  Hash,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type TargetPlan = "BASIC" | "PRO" | "ELITE" | "ADD_KID" | "ALL";

interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  target_plan: TargetPlan;
  max_global_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const TARGET_LABELS: Record<TargetPlan, string> = {
  BASIC: "Basic Plan",
  PRO: "Pro Plan",
  ELITE: "Elite Plan",
  ADD_KID: "Add Kid Slot",
  ALL: "Any Upgrade / Add Kid",
};

export default function AdminCouponsPage() {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [targetPlan, setTargetPlan] = useState<TargetPlan>("BASIC");
  const [maxUses, setMaxUses] = useState<string>("");
  const [validFrom, setValidFrom] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const { data, error } = await supabase
        .from("coupon_codes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setCoupons((data || []) as CouponRow[]);
    } catch (error: any) {
      toast.error("Failed to load coupons: " + error.message);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        target_plan: targetPlan,
        description: description.trim() || null,
        is_active: isActive,
      };

      if (maxUses.trim()) {
        const parsed = parseInt(maxUses.trim(), 10);
        if (Number.isNaN(parsed) || parsed < 1) {
          toast.error("Max uses must be a positive number");
          setIsSubmitting(false);
          return;
        }
        payload.max_global_uses = parsed;
      }

      if (validFrom) {
        payload.valid_from = new Date(validFrom).toISOString();
      }

      if (validUntil) {
        payload.valid_until = new Date(validUntil).toISOString();
      }

      const { error } = await supabase.from("coupon_codes").insert(payload);
      if (error) throw error;

      toast.success("Coupon created successfully! ✨");

      setCode("");
      setDescription("");
      setTargetPlan("BASIC");
      setMaxUses("");
      setValidFrom("");
      setValidUntil("");
      setIsActive(true);

      fetchCoupons();
    } catch (error: any) {
      if (error.message?.includes("duplicate key")) {
        toast.error("Coupon code already exists. Try another code.");
      } else {
        toast.error("Failed to create coupon: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Coupon Wizard</span>
            <Sparkles className="w-6 h-6 text-brand-purple" />
          </h1>
          <p className="text-gray-500 font-bold mt-1">
            Create magic codes that instantly unlock Basic, Pro, Elite or Add Kid.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          layout
          className="xl:col-span-2 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-hot-pink uppercase tracking-[0.18em] mb-1">
                Create New Coupon
              </p>
              <h2 className="text-lg md:text-xl font-black text-gray-900 font-nunito">
                Simple, no-math magic codes
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-brand-purple/5 text-brand-purple text-xs font-black">
              <TicketPercent className="w-4 h-4" />
              No discounts, only unlocks
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest">
                  Coupon Code
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="BASIC2025, FREEKID1"
                    className="w-full pl-9 pr-3 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 text-sm font-bold text-gray-800 bg-gray-50/60"
                    maxLength={32}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest">
                  Unlocks
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["BASIC", "PRO", "ELITE", "ADD_KID"] as TargetPlan[]).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setTargetPlan(plan)}
                      className={`px-3 py-2 rounded-2xl border-2 text-xs font-black flex items-center justify-between cursor-pointer transition-all ${
                        targetPlan === plan
                          ? "border-brand-purple bg-brand-purple/5 text-brand-purple shadow-sm"
                          : "border-gray-100 bg-white text-gray-600 hover:border-brand-purple/30 hover:bg-brand-purple/5"
                      }`}
                    >
                      <span>{TARGET_LABELS[plan]}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTargetPlan("ALL")}
                    className={`px-3 py-2 rounded-2xl border-2 text-xs font-black col-span-2 flex items-center justify-between cursor-pointer transition-all ${
                      targetPlan === "ALL"
                        ? "border-hot-pink bg-hot-pink/5 text-hot-pink shadow-sm"
                        : "border-gray-100 bg-white text-gray-600 hover:border-hot-pink/30 hover:bg-hot-pink/5"
                    }`}
                  >
                    <span>{TARGET_LABELS.ALL}</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-600 uppercase tracking-widest">
                Notes for You (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Eg. Giveaway for Holi campaign, valid for first 50 parents."
                className="w-full min-h-[80px] rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 text-sm font-bold text-gray-800 bg-gray-50/60 resize-vertical px-3 py-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest">
                  Max Uses (optional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited if empty"
                  className="w-full px-3 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 text-sm font-bold text-gray-800 bg-gray-50/60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest">
                  Starts At (optional)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 text-sm font-bold text-gray-800 bg-gray-50/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest">
                  Expires At (optional)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-2xl border-2 border-gray-100 focus:border-brand-purple focus:ring-0 text-sm font-bold text-gray-800 bg-gray-50/60"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setIsActive((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black border-2 cursor-pointer transition-all ${
                  isActive
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Active immediately
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Create as inactive
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-purple text-white font-black text-sm shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Magic...
                  </>
                ) : (
                  <>
                    Save Coupon
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          layout
          className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.18em] mb-1">
                Recent Coupons
              </p>
              <h2 className="text-lg font-black text-gray-900 font-nunito">
                Last 20 created
              </h2>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-3 max-h-[480px] overflow-y-auto">
            {loadingCoupons ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm font-bold">Loading coupon magic...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
                <TicketPercent className="w-8 h-8" />
                <p className="text-sm font-bold text-center max-w-[220px]">
                  No coupons yet. Create your first magic code on the left!
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {coupons.map((coupon) => {
                  const isExpired =
                    coupon.valid_until &&
                    new Date(coupon.valid_until) < new Date();

                  return (
                    <motion.div
                      key={coupon.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2.5 py-1 rounded-xl bg-brand-purple/10 text-brand-purple text-[11px] font-black tracking-widest uppercase">
                            {coupon.code}
                          </span>
                          <span className="hidden md:inline text-[11px] font-bold text-gray-400 truncate">
                            {TARGET_LABELS[coupon.target_plan]}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            !coupon.is_active
                              ? "bg-gray-200 text-gray-600"
                              : isExpired
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {!coupon.is_active
                            ? "INACTIVE"
                            : isExpired
                            ? "EXPIRED"
                            : "ACTIVE"}
                        </span>
                      </div>

                      {coupon.description && (
                        <p className="text-[11px] font-bold text-gray-500 line-clamp-2">
                          {coupon.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                        <span>
                          Uses:{" "}
                          {coupon.max_global_uses
                            ? `${coupon.used_count}/${coupon.max_global_uses}`
                            : `${coupon.used_count} / ∞`}
                        </span>
                        {coupon.valid_until && (
                          <span>
                            Expires:{" "}
                            {new Date(
                              coupon.valid_until
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

