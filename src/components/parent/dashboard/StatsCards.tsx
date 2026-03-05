"use client";

import { Users, FileText, Clock, Loader2, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getParentStats } from "@/actions/parent";

import Link from "next/link";

interface Child {
  id: string;
  total_posts: number;
  learning_hours?: number; // Optional in case it's missing, but we'll try to sum it
}

export default function StatsCards() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalChildren: 0,
    totalPosts: 0,
    learningHours: 0,
    activityHours: 0,
    totalExams: 0
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const data = await getParentStats();
        
        if (data) {
          setStatsData({
            totalChildren: data.totalChildren || 0,
            totalPosts: data.totalPosts || 0,
            learningHours: data.learningHours || 0,
            activityHours: data.activityHours || 0,
            totalExams: data.totalExams || 0
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const stats = [
    { label: "Total Children", value: statsData.totalChildren, icon: Users, color: "text-brand-purple", bg: "bg-brand-purple/10" },
    { label: "Total Posts", value: statsData.totalPosts, icon: FileText, color: "text-hot-pink", bg: "bg-hot-pink/10" },
    { label: "Learning Hours", value: `${statsData.learningHours.toFixed(1)}h`, icon: Clock, color: "text-sunshine-yellow", bg: "bg-sunshine-yellow/10" },
    { label: "Activity Hours", value: `${statsData.activityHours.toFixed(1)}h`, icon: Clock, color: "text-grass-green", bg: "bg-grass-green/10" },
    { label: "Exams Taken", value: statsData.totalExams, icon: Award, color: "text-sky-blue", bg: "bg-sky-blue/10" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 h-[106px] animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-gray-100"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-24"></div>
              <div className="h-8 bg-gray-100 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
      {stats.map((stat, i) => {
        const CardContent = (
          <div key={i} className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow h-full">
            <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wide leading-tight">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 font-nunito leading-tight mt-0.5">{stat.value}</p>
            </div>
          </div>
        );

        if (stat.label === "Exams Taken") {
          return (
            <Link key={i} href="/parent/results" className="block cursor-pointer">
              {CardContent}
            </Link>
          );
        }

        return CardContent;
      })}
    </div>
  );
}
