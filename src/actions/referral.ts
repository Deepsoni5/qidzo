"use server";

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { getOrSetCache, invalidateCache } from "@/lib/redis";

interface ReferralStats {
  totalSignups: number;
  purchasedPlans: number;
  estimatedEarnings: number;
  referralCode: string;
  referralLink: string;
}

interface ReferralActivity {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: string;
  createdAt: string;
  earnings: number;
}

// Commission map: 50% of plan price per interval and currency
const COMMISSION_MAP: Record<string, Record<string, Record<string, number>>> = {
  INR: {
    monthly: { BASIC: 49.5, PRO: 149.5, ELITE: 199.5 },
    yearly: { BASIC: 499.5, PRO: 1499.5, ELITE: 1999.5 },
  },
  USD: {
    monthly: { BASIC: 1.5, PRO: 2.5, ELITE: 3.5 },
    yearly: { BASIC: 7, PRO: 20, ELITE: 27.5 },
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

// Generate or get referral code for parent
export async function getOrCreateReferralCode() {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Get parent data
    const { data: parentData, error: parentError } = await supabase
      .from("parents")
      .select("parent_id, referral_code")
      .eq("clerk_id", user.id)
      .single();

    if (parentError || !parentData) {
      return { success: false, error: "Parent not found" };
    }

    // If referral code already exists, return it
    if (parentData.referral_code) {
      return {
        success: true,
        referralCode: parentData.referral_code,
      };
    }

    // Generate new referral code (use parent_id as code)
    const referralCode = parentData.parent_id;

    // Update parent with referral code
    const { error: updateError } = await supabase
      .from("parents")
      .update({ referral_code: referralCode })
      .eq("parent_id", parentData.parent_id);

    if (updateError) {
      console.error("Error updating referral code:", updateError);
      return { success: false, error: "Failed to generate referral code" };
    }

    // Invalidate cache
    await invalidateCache(`parent:profile:${user.id}`);

    return {
      success: true,
      referralCode,
    };
  } catch (error) {
    console.error("Error in getOrCreateReferralCode:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get referral stats for current parent
export async function getReferralStats(): Promise<ReferralStats | null> {
  try {
    const user = await currentUser();
    if (!user) return null;

    // Get parent data
    const { data: parentData } = await supabase
      .from("parents")
      .select("parent_id, referral_code")
      .eq("clerk_id", user.id)
      .single();

    if (!parentData) return null;

    // If no referral code, generate one
    if (!parentData.referral_code) {
      await getOrCreateReferralCode();
      return getReferralStats(); // Retry after generating
    }

    // Cache referral stats for 2 minutes
    const cacheKey = `referral:stats:${parentData.parent_id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        // Get all referrals
        const { data: referrals } = await supabase
          .from("parents")
          .select(
            "id, subscription_plan, subscription_interval, subscription_currency, first_paid_plan",
          )
          .eq("referred_by", parentData.parent_id);

        const totalSignups = referrals?.length || 0;

        // Count only those who have made a first purchase (first_paid_plan is not null)
        const purchasedPlans =
          referrals?.filter((r) => r.first_paid_plan !== null).length || 0;

        // Calculate earnings based on FIRST paid plan + interval + currency (one-time commission)
        const estimatedEarnings =
          referrals?.reduce((sum, r) => {
            if (!r.first_paid_plan) return sum;
            return (
              sum +
              getCommission(
                r.first_paid_plan,
                r.subscription_interval,
                r.subscription_currency,
              )
            );
          }, 0) || 0;

        const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://qidzo.com"}/sign-up?ref=${parentData.referral_code}`;

        return {
          totalSignups,
          purchasedPlans,
          estimatedEarnings,
          referralCode: parentData.referral_code,
          referralLink,
        };
      },
      120, // 2 minutes cache
    );
  } catch (error) {
    console.error("Error in getReferralStats:", error);
    return null;
  }
}

// Get recent referral activity
export async function getReferralActivity(): Promise<ReferralActivity[]> {
  try {
    const user = await currentUser();
    if (!user) return [];

    // Get parent data
    const { data: parentData } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (!parentData) return [];

    // Cache activity for 1 minute
    const cacheKey = `referral:activity:${parentData.parent_id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        // Get all referrals with details
        const { data: referrals } = await supabase
          .from("parents")
          .select(
            "id, name, email, subscription_plan, subscription_interval, subscription_currency, first_paid_plan, created_at",
          )
          .eq("referred_by", parentData.parent_id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!referrals) return [];

        return referrals.map((r) => {
          const earnings = getCommission(
            r.first_paid_plan || null,
            r.subscription_interval || null,
            r.subscription_currency || null,
          );

          return {
            id: r.id,
            name: r.name,
            email: r.email,
            subscriptionPlan: r.first_paid_plan || "FREE",
            createdAt: r.created_at,
            earnings,
          };
        });
      },
      60, // 1 minute cache
    );
  } catch (error) {
    console.error("Error in getReferralActivity:", error);
    return [];
  }
}

// Validate and apply referral code during signup
export async function applyReferralCode(
  referralCode: string,
  newParentId: string,
) {
  try {
    // Check if referral code exists
    const { data: referrer } = await supabase
      .from("parents")
      .select("parent_id, referral_code")
      .eq("referral_code", referralCode)
      .single();

    if (!referrer) {
      return { success: false, error: "Invalid referral code" };
    }

    // Check if trying to refer themselves
    if (referrer.parent_id === newParentId) {
      return { success: false, error: "Cannot refer yourself" };
    }

    // Update new parent with referral
    const { error: updateError } = await supabase
      .from("parents")
      .update({ referred_by: referrer.parent_id })
      .eq("parent_id", newParentId);

    if (updateError) {
      console.error("Error applying referral:", updateError);
      return { success: false, error: "Failed to apply referral code" };
    }

    // Invalidate referrer's cache
    await invalidateCache(`referral:stats:${referrer.parent_id}`);
    await invalidateCache(`referral:activity:${referrer.parent_id}`);

    return { success: true };
  } catch (error) {
    console.error("Error in applyReferralCode:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
