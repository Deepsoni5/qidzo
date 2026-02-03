"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import StatsCards from "@/components/parent/dashboard/StatsCards";
import ChildrenList from "@/components/parent/dashboard/ChildrenList";
import AnalyticsCharts from "@/components/parent/dashboard/AnalyticsCharts";
import RecentActivity from "@/components/parent/dashboard/RecentActivity";
import PostsList from "@/components/parent/dashboard/PostsList";

export default function ParentDashboard() {
  const { user, isLoaded } = useUser();
  const [parentName, setParentName] = useState("");

  useEffect(() => {
    if (user) {
        setParentName(user.firstName || "Parent");
    }
  }, [user]);

  if (!isLoaded) return <div className="p-8 text-center text-gray-500 font-bold">Loading dashboard...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="text-3xl font-black font-nunito text-gray-900">
          Welcome back, {parentName}! 👋
        </h1>
        <p className="text-gray-500 font-bold">Here's what your kids are up to today.</p>
      </div>

      <StatsCards />
      
      <ChildrenList />
      
      <AnalyticsCharts />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <PostsList />
      </div>
    </div>
  );
}
