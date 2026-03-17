"use server";

import { supabase } from "@/lib/supabaseClient";

export interface AdminReferralRecord {
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referralCode: string;
  totalSignups: number;
  purchasedPlans: number;
  totalCommission: number;
  referrals: AdminReferralEntry[];
}

export interface AdminReferralEntry {
  id: string;
  refereeName: string;
  refereeEmail: string;
  signedUpAt: string;
  firstPaidPlan: string | null;
  firstPaidInterval: string | null; // monthly or yearly
  firstPaidCurrency: string | null; // INR or USD
  currentPlan: string;
  commission: number;
}

export interface AdminReferralSummary {
  totalReferrers: number;
  totalSignups: number;
  totalPurchases: number;
  totalCommissionOwed: number;
  records: AdminReferralRecord[];
}

// Commission map: 50% of plan price per interval and currency
const COMMISSION_MAP: Record<string, Record<string, Record<string, number>>> = {
  INR: {
    monthly: { BASIC: 49.5, PRO: 149.5, ELITE: 199.5 },
    yearly: { BASIC: 499.5, PRO: 1499.5, ELITE: 1999.5 },
  },
  USD: {
    monthly: { BASIC: 1.5, PRO: 2.5, ELITE: 3.5 },
    yearly: { BASIC: 12.5, PRO: 20, ELITE: 27.5 },
  },
};

function getCommission(
  plan: string | null,
  interval: string | null,
  currency: string | null,
): number {
  if (!plan) return 0;
  const cur = currency === "USD" ? "USD" : "INR";
  const intv = interval === "yearly" ? "yearly" : "monthly";
  return COMMISSION_MAP[cur]?.[intv]?.[plan] ?? 0;
}

export async function getAdminReferralData(): Promise<AdminReferralSummary> {
  try {
    // Get all parents who have a referral_code (they are referrers)
    const { data: referrers, error: referrersError } = await supabase
      .from("parents")
      .select("parent_id, name, email, referral_code")
      .not("referral_code", "is", null);

    if (referrersError || !referrers) {
      console.error("Error fetching referrers:", referrersError);
      return {
        totalReferrers: 0,
        totalSignups: 0,
        totalPurchases: 0,
        totalCommissionOwed: 0,
        records: [],
      };
    }

    // Get all referred parents (those with referred_by set)
    const { data: referredParents, error: referredError } = await supabase
      .from("parents")
      .select(
        "id, parent_id, name, email, referred_by, subscription_plan, subscription_interval, subscription_currency, first_paid_plan, created_at",
      )
      .not("referred_by", "is", null);

    if (referredError) {
      console.error("Error fetching referred parents:", referredError);
      return {
        totalReferrers: 0,
        totalSignups: 0,
        totalPurchases: 0,
        totalCommissionOwed: 0,
        records: [],
      };
    }

    const referred = referredParents || [];

    // Build records per referrer
    const records: AdminReferralRecord[] = referrers
      .map((referrer) => {
        const myReferrals = referred.filter(
          (r) => r.referred_by === referrer.parent_id,
        );

        const entries: AdminReferralEntry[] = myReferrals.map((r) => {
          const interval = r.subscription_interval || "monthly";
          // Use stored currency from DB (saved by webhook from notes.currency)
          // Falls back to INR for old records created before this fix
          const currency: "INR" | "USD" =
            r.subscription_currency === "USD" ? "USD" : "INR";
          const commission = getCommission(
            r.first_paid_plan || null,
            interval,
            currency,
          );

          return {
            id: r.id,
            refereeName: r.name || "Unknown",
            refereeEmail: r.email || "",
            signedUpAt: r.created_at,
            firstPaidPlan: r.first_paid_plan || null,
            firstPaidInterval: interval,
            firstPaidCurrency: currency,
            currentPlan: r.subscription_plan || "FREE",
            commission,
          };
        });

        const totalCommission = entries.reduce(
          (sum, e) => sum + e.commission,
          0,
        );
        const purchasedPlans = entries.filter(
          (e) => e.firstPaidPlan !== null,
        ).length;

        return {
          referrerId: referrer.parent_id,
          referrerName: referrer.name || "Unknown",
          referrerEmail: referrer.email || "",
          referralCode: referrer.referral_code,
          totalSignups: myReferrals.length,
          purchasedPlans,
          totalCommission,
          referrals: entries,
        };
      })
      .filter((r) => r.totalSignups > 0); // Only show referrers who have at least 1 signup

    const totalSignups = records.reduce((s, r) => s + r.totalSignups, 0);
    const totalPurchases = records.reduce((s, r) => s + r.purchasedPlans, 0);
    const totalCommissionOwed = records.reduce(
      (s, r) => s + r.totalCommission,
      0,
    );

    return {
      totalReferrers: records.length,
      totalSignups,
      totalPurchases,
      totalCommissionOwed,
      records,
    };
  } catch (error) {
    console.error("Error in getAdminReferralData:", error);
    return {
      totalReferrers: 0,
      totalSignups: 0,
      totalPurchases: 0,
      totalCommissionOwed: 0,
      records: [],
    };
  }
}
