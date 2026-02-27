"use client";

import { useMemo } from "react";
import {
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles,
  Star,
  TrendingUp,
  BarChart3,
  GraduationCap,
  ImageIcon,
  Link,
  Mail,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Image from "next/image";

interface SchoolDashboardContentProps {
  data: any;
}

export default function SchoolDashboardContent({
  data,
}: SchoolDashboardContentProps) {
  const stats = useMemo(
    () => [
      {
        label: "Total Followers",
        value: data.analytics.totalFollowers.toLocaleString(),
        growth: data.analytics.followerGrowth,
        icon: Users,
        color: "text-sky-blue",
        bg: "bg-sky-blue/10",
        trend: data.analytics.followerGrowth > 0 ? "up" : "down",
      },
      {
        label: "Post Engagement",
        value: data.analytics.postEngagement.toLocaleString(),
        growth: data.analytics.engagementGrowth,
        icon: BarChart3,
        color: "text-brand-purple",
        bg: "bg-brand-purple/10",
        trend: data.analytics.engagementGrowth > 0 ? "up" : "down",
      },
      {
        label: "Admission Inquiries",
        value: data.analytics.admissionInquiries.toLocaleString(),
        growth: data.analytics.inquiryGrowth,
        icon: GraduationCap,
        color: "text-grass-green",
        bg: "bg-grass-green/10",
        trend: data.analytics.inquiryGrowth > 0 ? "up" : "down",
      },
      {
        label: "Total Posts",
        value: data.analytics.examParticipation.toLocaleString(),
        growth: data.analytics.participationGrowth,
        icon: FileText,
        color: "text-sunshine-yellow",
        bg: "bg-sunshine-yellow/10",
        trend: data.analytics.participationGrowth > 0 ? "up" : "down",
      },
    ],
    [data],
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Banner */}
      <div className="relative mb-10 p-8 rounded-[40px] bg-gradient-to-br from-sky-400 via-sky-500 to-brand-purple overflow-hidden shadow-2xl shadow-sky-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-[32px] blur-xl group-hover:blur-2xl transition-all" />
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-white p-3 shadow-xl relative overflow-hidden border-4 border-white/20">
              <Image
                src={
                  data.school.logo_url ||
                  "https://api.dicebear.com/7.x/initials/svg?seed=" +
                    data.school.name
                }
                alt={data.school.name}
                fill
                className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>

          <div className="text-center md:text-left text-white">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-sunshine-yellow fill-sunshine-yellow" />
                Verified Partner
              </span>
              {data.school.subscription_plan === "ELITE" && (
                <span className="bg-sunshine-yellow/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-sunshine-yellow/20 text-sunshine-yellow flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-sunshine-yellow" />
                  Elite Plan
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-nunito mb-2 drop-shadow-sm tracking-tight">
              {data.school.name}
            </h1>
            <p className="text-sky-50 font-bold opacity-90 max-w-xl text-sm md:text-base leading-relaxed">
              Managing your digital campus is easier than ever. Reach parents,
              conduct exams, and build your community!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="group bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`}
            />

            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div
                className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-gray-900 font-nunito">
                  {stat.value}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              <div
                className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-black ${stat.trend === "up" ? "bg-grass-green/10 text-grass-green" : "bg-red-500/10 text-red-500"}`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.growth}%
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                vs last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Activity Area Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black font-nunito text-gray-900 flex items-center gap-2">
                Growth Overview <TrendingUp className="w-5 h-5 text-sky-blue" />
              </h3>
              <p className="text-sm font-bold text-gray-400">
                Monthly follower and engagement trends
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-blue" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  Followers
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-purple" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  Engagement
                </span>
              </div>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.activityData}>
                <defs>
                  <linearGradient
                    id="colorFollowers"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorEngagement"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: "bold" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: "bold" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "24px",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    padding: "16px",
                  }}
                  itemStyle={{
                    fontWeight: "900",
                    fontSize: "14px",
                    fontFamily: "Nunito, sans-serif",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke="#0EA5E9"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorFollowers)"
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="#8B5CF6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorEngagement)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Distribution Pie Chart */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-black font-nunito text-gray-900">
              Content Stats
            </h3>
            <p className="text-sm font-bold text-gray-400">
              Post distribution by category
            </p>
          </div>

          <div className="flex-1 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {data.categoryData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 mt-4">
            {data.categoryData.map((cat: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {cat.name}
                  </span>
                </div>
                <span className="text-xs font-black text-gray-900">
                  {cat.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black font-nunito text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-dashed border-gray-100 hover:border-sky-blue hover:bg-sky-blue/5 transition-all group cursor-pointer">
              <div className="p-3 rounded-2xl bg-sky-blue/10 text-sky-blue group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
                Post Update
              </span>
            </button>
            <button className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-dashed border-gray-100 hover:border-brand-purple hover:bg-brand-purple/5 transition-all group cursor-pointer">
              <div className="p-3 rounded-2xl bg-brand-purple/10 text-brand-purple group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
                Create Exam
              </span>
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black font-nunito text-gray-900">
              Recent Inquiries
            </h3>
            <Link
              href="/school/inquiries"
              className="text-[10px] font-black text-sky-blue uppercase tracking-widest hover:underline"
            >
              View All
            </Link>
          </div>
          {data.recentInquiries && data.recentInquiries.length > 0 ? (
            <div className="space-y-4">
              {data.recentInquiries.map((inquiry: any) => (
                <Link
                  key={inquiry.inquiry_id}
                  href="/school/inquiries"
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${inquiry.is_read ? "bg-gray-100 text-gray-400" : "bg-sky-blue/10 text-sky-blue"}`}
                  >
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 leading-none mb-1 truncate">
                      {inquiry.subject}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      {inquiry.name} •{" "}
                      {new Date(inquiry.created_at).toLocaleDateString(
                        "en-IN",
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                  </div>
                  {!inquiry.is_read && (
                    <div className="w-2 h-2 rounded-full bg-hot-pink animate-pulse shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400">
                No inquiries yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function School({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22v-4" />
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
