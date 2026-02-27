"use client";

import {
  Users,
  FileText,
  Mail,
  TrendingUp,
  Heart,
  MessageSquare,
  Loader2,
  UserCheck,
  Baby,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  skyBlue: "#0EA5E9",
  brandPurple: "#8B5CF6",
  hotPink: "#EC4899",
  sunshineYellow: "#FBBF24",
  grassGreen: "#10B981",
};

interface SchoolAnalyticsContentProps {
  data: any;
}

export default function SchoolAnalyticsContent({ data }: SchoolAnalyticsContentProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Followers"
          value={data.followers.total}
          icon={Users}
          color="sky-blue"
          subtitle={`${data.followers.children} children, ${data.followers.parents} parents`}
        />
        <StatCard
          label="Total Posts"
          value={data.posts.total}
          icon={FileText}
          color="brand-purple"
          subtitle={`${data.posts.totalLikes} likes, ${data.posts.totalComments} comments`}
        />
        <StatCard
          label="Inquiries"
          value={data.inquiries.total}
          icon={Mail}
          color="grass-green"
          subtitle={`${data.inquiries.pending} pending`}
        />
        <StatCard
          label="Avg Engagement"
          value={data.posts.avgEngagement}
          icon={TrendingUp}
          color="hot-pink"
          subtitle="per post"
        />
      </div>

      {/* Followers Analytics */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black font-nunito text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-sky-blue" />
              Followers Growth
            </h2>
            <p className="text-sm font-bold text-gray-500 mt-1">
              Track your follower growth over the last 30 days
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-blue/10">
              <Baby className="w-4 h-4 text-sky-blue" />
              <span className="text-xs font-black text-sky-blue">
                {data.followers.children} Children
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-purple/10">
              <UserCheck className="w-4 h-4 text-brand-purple" />
              <span className="text-xs font-black text-brand-purple">
                {data.followers.parents} Parents
              </span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.followers.overTime}>
              <defs>
                <linearGradient id="colorChildren" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.skyBlue}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.skyBlue}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorParents" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.brandPurple}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.brandPurple}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: "bold" }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: "bold" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  padding: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="children"
                stroke={COLORS.skyBlue}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorChildren)"
                name="Children"
              />
              <Area
                type="monotone"
                dataKey="parents"
                stroke={COLORS.brandPurple}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorParents)"
                name="Parents"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Posts & Engagement */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Posts Over Time */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-black font-nunito text-gray-900 flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-brand-purple" />
            Posts & Engagement
          </h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.posts.overTime}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: "bold" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: "bold" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="posts"
                  fill={COLORS.brandPurple}
                  radius={[8, 8, 0, 0]}
                  name="Posts"
                />
                <Bar
                  dataKey="likes"
                  fill={COLORS.hotPink}
                  radius={[8, 8, 0, 0]}
                  name="Likes"
                />
                <Bar
                  dataKey="comments"
                  fill={COLORS.skyBlue}
                  radius={[8, 8, 0, 0]}
                  name="Comments"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-black font-nunito text-gray-900 flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-grass-green" />
            Top Categories
          </h2>

          <div className="space-y-3">
            {data.posts.byCategory.slice(0, 5).map((cat: any, i: number) => {
              const colors = [
                COLORS.skyBlue,
                COLORS.grassGreen,
                COLORS.sunshineYellow,
                COLORS.hotPink,
                COLORS.brandPurple,
              ];
              const color = colors[i % colors.length];
              const maxEngagement = Math.max(
                ...data.posts.byCategory.map((c: any) => c.engagement),
              );
              const percentage = (cat.engagement / maxEngagement) * 100;

              return (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-700">
                      {cat.name}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      {cat.posts} posts • {cat.engagement} engagement
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inquiries Analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inquiries Over Time */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-black font-nunito text-gray-900 flex items-center gap-2 mb-6">
            <Mail className="w-5 h-5 text-grass-green" />
            Inquiries Trend
          </h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.inquiries.overTime}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: "bold" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: "bold" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={COLORS.grassGreen}
                  strokeWidth={3}
                  dot={{ fill: COLORS.grassGreen, r: 4 }}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="children"
                  stroke={COLORS.skyBlue}
                  strokeWidth={2}
                  dot={{ fill: COLORS.skyBlue, r: 3 }}
                  name="From Children"
                />
                <Line
                  type="monotone"
                  dataKey="parents"
                  stroke={COLORS.brandPurple}
                  strokeWidth={2}
                  dot={{ fill: COLORS.brandPurple, r: 3 }}
                  name="From Parents"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inquiry Status */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-black font-nunito text-gray-900 mb-6">
            Status Breakdown
          </h2>

          <div className="space-y-4">
            <StatusItem
              label="Pending"
              value={data.inquiries.pending}
              total={data.inquiries.total}
              color={COLORS.sunshineYellow}
            />
            <StatusItem
              label="Replied"
              value={data.inquiries.replied}
              total={data.inquiries.total}
              color={COLORS.grassGreen}
            />
            <StatusItem
              label="Closed"
              value={data.inquiries.closed}
              total={data.inquiries.total}
              color="#9CA3AF"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">
                From Children
              </span>
              <span className="text-sm font-black text-sky-blue">
                {data.inquiries.fromChildren}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">
                From Parents
              </span>
              <span className="text-sm font-black text-brand-purple">
                {data.inquiries.fromParents}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Inquiry Subjects */}
      {data.inquiries.bySubject.length > 0 && (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-black font-nunito text-gray-900 mb-6">
            Top Inquiry Topics
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.inquiries.bySubject
              .slice(0, 5)
              .map((item: any, i: number) => {
                const colors = [
                  COLORS.skyBlue,
                  COLORS.grassGreen,
                  COLORS.sunshineYellow,
                  COLORS.hotPink,
                  COLORS.brandPurple,
                ];
                const color = colors[i % colors.length];

                return (
                  <div
                    key={item.subject}
                    className="p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 transition-all"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <span className="text-xl font-black" style={{ color }}>
                        {item.count}
                      </span>
                    </div>
                    <p className="text-sm font-black text-gray-900 leading-tight">
                      {item.subject}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Engagement Breakdown */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-black font-nunito text-gray-900 mb-6">
          Engagement Sources
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <EngagementCard
            icon={Heart}
            label="Likes from Children"
            value={data.engagement.likesFromChildren}
            color={COLORS.hotPink}
          />
          <EngagementCard
            icon={Heart}
            label="Likes from Parents"
            value={data.engagement.likesFromParents}
            color={COLORS.brandPurple}
          />
          <EngagementCard
            icon={MessageSquare}
            label="Comments from Children"
            value={data.engagement.commentsFromChildren}
            color={COLORS.skyBlue}
          />
          <EngagementCard
            icon={MessageSquare}
            label="Comments from Schools"
            value={data.engagement.commentsFromSchools}
            color={COLORS.grassGreen}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    "sky-blue": { bg: "bg-sky-blue/10", text: "text-sky-blue" },
    "brand-purple": { bg: "bg-brand-purple/10", text: "text-brand-purple" },
    "grass-green": { bg: "bg-grass-green/10", text: "text-grass-green" },
    "hot-pink": { bg: "bg-hot-pink/10", text: "text-hot-pink" },
  };

  const colors = colorMap[color] || colorMap["sky-blue"];

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
      <div
        className={`p-3 rounded-2xl ${colors.bg} ${colors.text} inline-flex mb-3`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-black font-nunito text-gray-900 mb-1">
        {value.toLocaleString()}
      </p>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
        {label}
      </p>
      {subtitle && (
        <p className="text-xs font-bold text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}

function StatusItem({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-600">{label}</span>
        <span className="text-sm font-black text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function EngagementCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center p-6 rounded-2xl border-2 border-gray-100">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
      <p className="text-2xl font-black font-nunito text-gray-900 mb-1">
        {value.toLocaleString()}
      </p>
      <p className="text-xs font-bold text-gray-500">{label}</p>
    </div>
  );
}
