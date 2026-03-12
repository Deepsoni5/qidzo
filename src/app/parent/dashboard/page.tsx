"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import StatsCards from "@/components/parent/dashboard/StatsCards";
import ChildrenList from "@/components/parent/dashboard/ChildrenList";
import AnalyticsCharts from "@/components/parent/dashboard/AnalyticsCharts";
import RecentActivity from "@/components/parent/dashboard/RecentActivity";
import PostsList from "@/components/parent/dashboard/PostsList";
import PricingSection from "@/components/parent/pricing/PricingSection";
import { Sparkles, ArrowRight, UserPlus, Baby, Award } from "lucide-react";
import { getMyChildren, getParentProfile } from "@/actions/parent";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentDashboard() {
  const { user, isLoaded } = useUser();
  const [parentName, setParentName] = useState("");
  const [parentProfile, setParentProfile] = useState<any>(null);
  const [sharedChildren, setSharedChildren] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setParentName(user.firstName || "Parent");

      // Fetch shared data once (used by multiple components)
      const fetchSharedData = async () => {
        const [profile, children] = await Promise.all([
          getParentProfile(),
          getMyChildren(),
        ]);
        setParentProfile(profile);
        setSharedChildren(children);
      };
      fetchSharedData();
    }
  }, [user]);

  // Dynamic Plan Logic
  const currentPlan = parentProfile?.subscription_plan || "FREE";

  const getUpgradeInfo = () => {
    switch (currentPlan.toUpperCase()) {
      case "FREE":
        return {
          planLabel: "Free Plan",
          upgradeText: "Upgrade to Qidzo Basic",
          nextPlan: "BASIC",
          gradient: "from-brand-purple to-hot-pink",
        };
      case "BASIC":
        return {
          planLabel: "Basic Plan",
          upgradeText: "Upgrade to Qidzo Pro",
          nextPlan: "PRO",
          gradient: "from-sky-blue to-brand-purple",
        };
      case "PRO":
        return {
          planLabel: "Pro Plan",
          upgradeText: "Upgrade to Qidzo Elite",
          nextPlan: "ELITE",
          gradient: "from-yellow-400 to-hot-pink",
        };
      case "ELITE":
        return {
          planLabel: "Elite Plan",
          upgradeText: "You are on the Top Plan!",
          nextPlan: null,
          gradient: "from-hot-pink to-brand-purple",
        };
      default:
        return {
          planLabel: "Free Plan",
          upgradeText: "Upgrade to Qidzo Basic",
          nextPlan: "BASIC",
          gradient: "from-brand-purple to-hot-pink",
        };
    }
  };

  const upgradeInfo = getUpgradeInfo();
  const maxSlots = parentProfile?.max_children_slots || 0;

  if (!isLoaded)
    return (
      <div className="p-8 text-center text-gray-500 font-bold">
        Loading dashboard...
      </div>
    );

  return (
    <div className="animate-in fade-in duration-500 pb-20 lg:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-purple transition-colors bg-gray-100 hover:bg-brand-purple/10 px-4 py-2.5 rounded-2xl w-fit mb-6 border-2 border-transparent active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Website
          </Link>
          <h1 className="text-3xl font-black font-nunito text-gray-900">
            Welcome back, {parentName}! 👋
          </h1>
          <p className="text-gray-500 font-bold">
            Here's what your kids are up to today.
          </p>
        </div>

        {/* Dynamic Upgrade Banner */}
        {!parentProfile ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Skeleton className="h-28 w-full sm:w-72 rounded-3xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse border-2 border-gray-200" />
            <Skeleton className="h-28 flex-1 rounded-3xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse border-2 border-gray-200" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Slots Counter */}
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-4 flex items-center gap-4 shadow-sm">
              <div
                className={`p-3 rounded-2xl ${maxSlots > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
              >
                <Baby className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Profile Slots
                </p>
                <p className="text-lg font-black font-nunito text-gray-900 leading-none mt-1">
                  {maxSlots} {maxSlots === 1 ? "Slot" : "Slots"} Left
                </p>
                <p className="text-[10px] font-bold text-gray-500 mt-1 italic">
                  {maxSlots > 0
                    ? "Ready to add more kids! ✨"
                    : "Time to add more slots! 🚀"}
                </p>
              </div>
              {maxSlots <= 0 && (
                <Link
                  href="/parent/upgrade"
                  className="ml-2 p-2 bg-brand-purple/10 text-brand-purple rounded-xl hover:bg-brand-purple hover:text-white transition-all active:scale-95"
                  title="Add Slots"
                >
                  <UserPlus className="w-5 h-5" />
                </Link>
              )}
            </div>

            <Link
              href="/parent/upgrade"
              className={`group relative overflow-hidden bg-gradient-to-r ${upgradeInfo.gradient} p-1 rounded-3xl shadow-lg shadow-brand-purple/20 hover:scale-[1.02] transition-all active:scale-95 cursor-pointer`}
            >
              <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-[20px] flex items-center gap-4 text-white h-full">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider opacity-80">
                    {upgradeInfo.planLabel}
                  </p>
                  <p className="font-black font-nunito text-lg">
                    {upgradeInfo.upgradeText}
                  </p>
                </div>
                {upgradeInfo.nextPlan && (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform ml-2" />
                )}
              </div>
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-hot-pink/20 rounded-full blur-xl" />
            </Link>
          </div>
        )}
      </div>

      <StatsCards />

      {/* Referral Promotion Banner */}
      <div className="mb-8">
        <Link
          href="/parent/referrals"
          className="group relative overflow-hidden bg-gradient-to-r from-grass-green to-sky-blue p-6 rounded-[32px] flex items-center justify-between hover:shadow-xl hover:shadow-grass-green/20 transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🎁
            </div>
            <div>
              <h2 className="text-xl font-black font-nunito text-white">
                Earn ₹500-₹1,500 per Referral!
              </h2>
              <p className="text-white/90 font-bold">
                Share Qidzo with friends and earn 50% commission on every plan
                purchase.
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:bg-white group-hover:text-grass-green transition-colors text-white">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* Decorative background elements */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </Link>
      </div>

      {/* Exam Results Link */}
      <div className="mb-8">
        <Link
          href="/parent/results"
          className="group relative overflow-hidden bg-white border-2 border-gray-100 p-6 rounded-[32px] flex items-center justify-between hover:border-brand-purple/20 hover:shadow-xl hover:shadow-brand-purple/5 transition-all active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-7 h-7 text-brand-purple" />
            </div>
            <div>
              <h2 className="text-xl font-black font-nunito text-gray-900">
                View Exam Results 📝
              </h2>
              <p className="text-gray-500 font-bold">
                Track your children's school performance and scores.
              </p>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-brand-purple group-hover:text-white transition-colors">
            <ArrowRight className="w-6 h-6" />
          </div>

          {/* Decorative background element */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-purple/5 rounded-full blur-2xl group-hover:bg-brand-purple/10 transition-colors" />
        </Link>
      </div>

      <ChildrenList
        initialChildren={sharedChildren}
        initialProfile={parentProfile}
      />

      <AnalyticsCharts initialChildren={sharedChildren} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <RecentActivity />
        <PostsList />
      </div>

      {/* Pricing Section at the bottom of Dashboard */}
      <div className="bg-gray-50/50 rounded-[40px] p-8 border-2 border-gray-100 mb-12">
        <PricingSection />
      </div>
    </div>
  );
}
