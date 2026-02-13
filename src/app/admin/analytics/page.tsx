"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Zap, 
  FileText, 
  ArrowUpRight,
  Clock,
  Calendar,
  Filter,
  Download,
  Loader2,
  PieChart,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    parents: 0,
    children: 0,
    posts: 0,
    activeToday: 0,
    totalLikes: 0,
    totalComments: 0
  });
  const [hourlyActivity, setHourlyActivity] = useState<number[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Basic counts
      const [parentsCount, childrenCount, postsCount, likesCount, commentsCount] = await Promise.all([
        supabase.from('parents').select('*', { count: 'exact', head: true }),
        supabase.from('children').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true })
      ]);

      // 2. Hourly activity from child_screen_logs
      // Format: 'YYYY-MM-DD' in Asia/Kolkata
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      const { data: logs, error: logsError } = await supabase
        .from('child_screen_logs')
        .select('child_id, ist_hour, seconds_spent')
        .eq('ist_date', today);

      if (logsError) throw logsError;

      const hourlyData = Array(24).fill(0);
      logs?.forEach(log => {
        if (typeof log.ist_hour === 'number' && log.ist_hour >= 0 && log.ist_hour < 24) {
          hourlyData[log.ist_hour] += log.seconds_spent || 0;
        }
      });
      
      // Normalize to 12 slots (2h each) as in the UI
      const binnedHourly = Array(12).fill(0).map((_, i) => {
        return (hourlyData[i * 2] || 0) + (hourlyData[i * 2 + 1] || 0);
      });
      
      const maxEngagement = Math.max(...binnedHourly, 1);
      setHourlyActivity(binnedHourly.map(v => Math.round((v / maxEngagement) * 100)));

      // 3. Category distribution
      const { data: postsWithCategories } = await supabase
        .from('posts')
        .select('category_id');
      
      const { data: categories } = await supabase
        .from('categories')
        .select('category_id, name, color');

      const catCounts: Record<string, number> = {};
      postsWithCategories?.forEach(p => {
        if (p.category_id) catCounts[p.category_id] = (catCounts[p.category_id] || 0) + 1;
      });

      const distribution = categories?.map(cat => ({
        label: cat.name,
        count: catCounts[cat.category_id] || 0,
        color: cat.color || '#8B5CF6',
        total: postsCount.count || 0
      })).sort((a, b) => b.count - a.count).slice(0, 4) || [];

      setCategoryDistribution(distribution);

      setStats({
        parents: parentsCount.count || 0,
        children: childrenCount.count || 0,
        posts: postsCount.count || 0,
        activeToday: logs ? new Set(logs.map((l: any) => l.child_id)).size : 0,
        totalLikes: likesCount.count || 0,
        totalComments: commentsCount.count || 0
      });
    } catch (error: any) {
      toast.error("Failed to load analytics: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    { label: "Total Parents", value: stats.parents, icon: Users, color: "text-brand-purple", bg: "bg-brand-purple/10", trend: "+8.2%", up: true },
    { label: "Registered Kids", value: stats.children, icon: Zap, color: "text-sky-blue", bg: "bg-sky-blue/10", trend: "+12.5%", up: true },
    { label: "Total Likes", value: stats.totalLikes, icon: TrendingUp, color: "text-hot-pink", bg: "bg-hot-pink/10", trend: "+4.1%", up: true },
    { label: "Total Comments", value: stats.totalComments, icon: Activity, color: "text-grass-green", bg: "bg-grass-green/10", trend: "+5.6%", up: true },
  ];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Analytics Insights</h1>
          <p className="text-gray-500 font-bold">Comprehensive data on platform growth and usage</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-50 rounded-2xl font-black text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-all">
                <Calendar className="w-4 h-4 text-brand-purple" /> Last 30 Days
            </button>
            <button className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 rounded-2xl font-black text-sm text-white shadow-xl shadow-gray-900/20 hover:bg-black transition-all">
                <Download className="w-4 h-4" /> Export Report
            </button>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
            Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-[32px] border border-gray-100 animate-pulse" />
            ))
        ) : (
            metricCards.map((card, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <span className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-1 rounded-full ${card.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {card.trend}
                        </span>
                    </div>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-1">{card.label}</p>
                    <h3 className="text-3xl font-black text-gray-900">{card.value}</h3>
                </motion.div>
            ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Content Distribution - Full Width */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900">Content Distribution</h3>
                    <p className="text-xs font-bold text-gray-400">Breakdown of all posts by category</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {categoryDistribution.slice(0, 3).map((cat, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: cat.color }}>
                                {cat.label[0]}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {categoryDistribution.length > 0 ? (
                    categoryDistribution.map((cat, i) => (
                        <div key={i} className="space-y-3 group">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-sm font-black text-gray-700 block">{cat.label}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.count} posts</span>
                                </div>
                                <span className="text-lg font-black text-gray-900">{Math.round((cat.count / cat.total) * 100 || 0)}%</span>
                            </div>
                            <div className="h-4 w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(cat.count / cat.total) * 100 || 0}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                                    className="h-full rounded-2xl shadow-inner"
                                    style={{ backgroundColor: cat.color }}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                        <PieChart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-sm font-bold text-gray-400">Waiting for category data...</p>
                    </div>
                )}
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-50 flex flex-wrap gap-4">
                {categoryDistribution.map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{cat.label}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Active Users Module */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-[40px] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-purple/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div>
                      <h3 className="text-3xl font-black mb-2">Platform Pulse</h3>
                      <p className="text-gray-400 font-bold max-w-md">Currently experiencing high engagement. Monitor live user sessions and moderation queues.</p>
                  </div>
                  <div className="flex gap-10">
                      <div>
                          <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-1">Live Kids</p>
                          <h4 className="text-5xl font-black text-brand-purple">{stats.activeToday}</h4>
                      </div>
                      <div>
                          <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-1">Queue Size</p>
                          <h4 className="text-5xl font-black text-hot-pink">12</h4>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
