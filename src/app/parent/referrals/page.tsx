"use client";

import { useEffect, useState } from "react";
import {
  getReferralStats,
  getReferralActivity,
  getOrCreateReferralCode,
} from "@/actions/referral";
import {
  Copy,
  Share2,
  Users,
  ShoppingBag,
  Coins,
  Loader2,
  CheckCircle2,
  Gift,
  TrendingUp,
  Calendar,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  detectUserCountry,
  getPricingData,
  type Currency,
} from "@/lib/currency";

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

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [activity, setActivity] = useState<ReferralActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Currency detection
  const [currency, setCurrency] = useState<Currency>("INR");
  const [isDetectingCurrency, setIsDetectingCurrency] = useState(true);
  const [pricingData, setPricingData] = useState(getPricingData("IN"));

  // Detect user currency on mount
  useEffect(() => {
    async function detectCurrency() {
      try {
        const country = await detectUserCountry();
        const data = getPricingData(country);
        setCurrency(data.currency);
        setPricingData(data);
      } catch (error) {
        console.error("Error detecting currency:", error);
        setCurrency("INR");
        setPricingData(getPricingData("IN"));
      } finally {
        setIsDetectingCurrency(false);
      }
    }
    detectCurrency();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, activityData] = await Promise.all([
        getReferralStats(),
        getReferralActivity(),
      ]);

      if (statsData) setStats(statsData);
      if (activityData) setActivity(activityData);
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!stats?.referralLink) return;

    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      toast.success("Link copied! 🎉", {
        description: "Share it with your friends to start earning!",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShareWhatsApp = () => {
    if (!stats?.referralLink) return;

    const message = `Hey! 👋 Join Qidzo - the best social learning platform for kids! Use my referral link to get started: ${stats.referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading || isDetectingCurrency) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-purple animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold">
            Loading your referral dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/parent/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-purple transition-colors mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-black font-nunito text-gray-900 mb-2">
            Earn with Referrals! 🎁
          </h1>
          <p className="text-gray-600 font-bold text-lg">
            Share Qidzo with friends and earn 50% commission on every plan they
            purchase!
          </p>
        </div>

        {/* Currency Indicator */}
        {currency === "USD" && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-brand-purple" />
              <span className="font-bold text-gray-600">
                Showing international pricing in USD
              </span>
            </div>
            <div className="max-w-2xl mx-auto bg-sky-blue/10 border-2 border-sky-blue/20 rounded-2xl px-4 py-3">
              <p className="text-center text-sm font-bold text-gray-700">
                💳 <span className="text-sky-blue">Note:</span> Commissions are
                calculated in USD. Earnings will be converted to your local
                currency during payout.
              </p>
            </div>
          </div>
        )}

        {/* Referral Link Card */}
        <div className="bg-gradient-to-br from-brand-purple to-hot-pink p-1 rounded-[32px] shadow-2xl shadow-brand-purple/20 mb-8">
          <div className="bg-white rounded-[28px] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-purple/10 rounded-2xl">
                <Gift className="w-6 h-6 text-brand-purple" />
              </div>
              <div>
                <h2 className="text-xl font-black font-nunito text-gray-900">
                  Your Referral Link
                </h2>
                <p className="text-sm text-gray-500 font-bold">
                  Share this link to start earning
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-4 border-2 border-gray-100">
              <p className="text-sm font-mono text-gray-700 break-all">
                {stats?.referralLink || "Generating..."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopyLink}
                disabled={!stats?.referralLink}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-purple text-white font-black py-3 px-6 rounded-xl hover:bg-brand-purple/90 transition-all active:scale-95 shadow-lg shadow-brand-purple/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleShareWhatsApp}
                disabled={!stats?.referralLink}
                className="flex-1 flex items-center justify-center gap-2 bg-grass-green text-white font-black py-3 px-6 rounded-xl hover:bg-grass-green/90 transition-all active:scale-95 shadow-lg shadow-grass-green/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border-2 border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-sky-blue/10 rounded-2xl">
                <Users className="w-6 h-6 text-sky-blue" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Total Signups
                </p>
                <p className="text-3xl font-black font-nunito text-gray-900">
                  {stats?.totalSignups || 0}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-bold">
              Friends who joined using your link
            </p>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border-2 border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-hot-pink/10 rounded-2xl">
                <ShoppingBag className="w-6 h-6 text-hot-pink" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Purchased Plans
                </p>
                <p className="text-3xl font-black font-nunito text-gray-900">
                  {stats?.purchasedPlans || 0}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-bold">
              Friends who bought a plan
            </p>
          </div>

          <div className="bg-gradient-to-br from-sunshine-yellow to-orange-400 rounded-[32px] p-6 shadow-lg shadow-orange-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wide">
                    Estimated Earnings
                  </p>
                  <p className="text-3xl font-black font-nunito text-white">
                    {formatCurrency(stats?.estimatedEarnings || 0)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/90 font-bold">
                50% commission on all purchases
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border-2 border-gray-100 mb-8">
          <h2 className="text-2xl font-black font-nunito text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-purple" />
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: "📤",
                title: "Share Link",
                desc: "Share your unique referral link with friends",
              },
              {
                step: "2",
                icon: "👥",
                title: "They Sign Up",
                desc: "Friends create account using your link",
              },
              {
                step: "3",
                icon: "💳",
                title: "They Purchase",
                desc: "Friends buy BASIC, PRO, or ELITE plan",
              },
              {
                step: "4",
                icon: "💰",
                title: "You Earn",
                desc: "Get 50% commission credited to you",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                  {item.icon}
                </div>
                <h3 className="font-black text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 font-bold">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border-2 border-gray-100 mb-8">
          <h2 className="text-2xl font-black font-nunito text-gray-900 mb-6">
            Commission Breakdown
          </h2>

          {/* Beautiful Commission Note */}
          <div className="bg-gradient-to-br from-sunshine-yellow/20 via-orange-100/30 to-hot-pink/20 rounded-2xl p-6 mb-6 border-2 border-orange-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sunshine-yellow to-orange-400 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg">
                💰
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-2 flex items-center gap-2">
                  How You Earn Commission
                  <span className="text-base">✨</span>
                </h3>
                <p className="text-gray-700 font-bold leading-relaxed mb-3">
                  When someone signs up using your referral link and purchases
                  any plan (BASIC, PRO, or ELITE), you earn{" "}
                  <span className="text-brand-purple font-black">
                    50% commission
                  </span>{" "}
                  on their purchase!
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-full text-xs font-black text-gray-700 border border-gray-200">
                    <span className="text-grass-green">✓</span> Instant tracking
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-full text-xs font-black text-gray-700 border border-gray-200">
                    <span className="text-grass-green">✓</span> Manual payouts
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 rounded-full text-xs font-black text-gray-700 border border-gray-200">
                    <span className="text-grass-green">✓</span> No limits
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                plan: "BASIC",
                monthlyPrice: pricingData.prices.basic.monthly,
                yearlyPrice: pricingData.prices.basic.yearly,
                monthlyCommission: pricingData.prices.basic.monthly / 2,
                yearlyCommission: pricingData.prices.basic.yearly / 2,
                color: "bg-sky-blue/10 border-sky-blue/20 text-sky-blue",
              },
              {
                plan: "PRO",
                monthlyPrice: pricingData.prices.pro.monthly,
                yearlyPrice: pricingData.prices.pro.yearly,
                monthlyCommission: pricingData.prices.pro.monthly / 2,
                yearlyCommission: pricingData.prices.pro.yearly / 2,
                color:
                  "bg-brand-purple/10 border-brand-purple/20 text-brand-purple",
              },
              {
                plan: "ELITE",
                monthlyPrice: pricingData.prices.elite.monthly,
                yearlyPrice: pricingData.prices.elite.yearly,
                monthlyCommission: pricingData.prices.elite.monthly / 2,
                yearlyCommission: pricingData.prices.elite.yearly / 2,
                color: "bg-hot-pink/10 border-hot-pink/20 text-hot-pink",
              },
            ].map((item) => (
              <div
                key={item.plan}
                className={`${item.color} rounded-2xl p-4 border-2`}
              >
                <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-3">
                  {item.plan} Plan
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-lg font-black font-nunito">
                      {pricingData.symbol}
                      {item.monthlyCommission.toFixed(2)}
                    </p>
                    <p className="text-xs font-bold opacity-70">
                      50% of {pricingData.symbol}
                      {item.monthlyPrice}/month
                    </p>
                  </div>
                  <div className="pt-2 border-t border-current opacity-20" />
                  <div>
                    <p className="text-lg font-black font-nunito">
                      {pricingData.symbol}
                      {item.yearlyCommission.toFixed(2)}
                    </p>
                    <p className="text-xs font-bold opacity-70">
                      50% of {pricingData.symbol}
                      {item.yearlyPrice}/year
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border-2 border-gray-100">
          <h2 className="text-2xl font-black font-nunito text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-purple" />
            Recent Referrals
          </h2>

          {activity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">
                No referrals yet
              </h3>
              <p className="text-gray-500 font-bold mb-6">
                Start sharing your link to see activity here!
              </p>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 bg-brand-purple text-white font-black py-3 px-6 rounded-xl hover:bg-brand-purple/90 transition-all active:scale-95"
              >
                <Copy className="w-5 h-5" />
                Copy Referral Link
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-purple/20 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        item.subscriptionPlan === "FREE"
                          ? "bg-gray-100"
                          : "bg-gradient-to-br from-brand-purple to-hot-pink text-white"
                      }`}
                    >
                      {item.subscriptionPlan === "FREE" ? "👤" : "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500 font-bold truncate">
                        {item.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {item.subscriptionPlan === "FREE" ? (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-black rounded-full">
                        Signed Up
                      </span>
                    ) : (
                      <>
                        <p className="font-black text-grass-green text-lg">
                          +{formatCurrency(item.earnings)}
                        </p>
                        <span className="inline-block px-3 py-1 bg-grass-green/10 text-grass-green text-xs font-black rounded-full">
                          {item.subscriptionPlan}
                        </span>
                      </>
                    )}
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
