"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  Clock,
  Zap,
  MoreVertical,
  UserPlus,
  MessageSquare,
  Eye,
  Activity,
  Calendar,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    activeChildren: 0,
    newToday: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [weeklyGrowth, setWeeklyGrowth] = useState<number[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Real Stats
      const [parentsCount, childrenCount, postsCount] = await Promise.all([
        supabase.from('parents').select('*', { count: 'exact', head: true }),
        supabase.from('children').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true })
      ]);

      // 2. Fetch New Today (Parents + Children)
      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);

      const [newChildren, newParents] = await Promise.all([
        supabase.from('children').select('id').gte('created_at', startOfToday.toISOString()),
        supabase.from('parents').select('id').gte('created_at', startOfToday.toISOString())
      ]);

      setStats({
        totalUsers: (parentsCount.count || 0) + (childrenCount.count || 0),
        totalPosts: postsCount.count || 0,
        activeChildren: childrenCount.count || 0,
        newToday: (newChildren.data?.length || 0) + (newParents.data?.length || 0)
      });

      // 3. Fetch Recent Activities (Combined latest users and posts)
      const { data: latestUsers } = await supabase
        .from('children')
        .select('id, name, username, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: latestPosts } = await supabase
        .from('posts')
        .select('id, title, child_id, created_at, children(name)')
        .order('created_at', { ascending: false })
        .limit(3);

      const combined = [
        ...(latestUsers?.map(u => ({ ...u, type: 'user', label: `New child registered: ${u.name}` })) || []),
        ...(latestPosts?.map(p => ({ 
          ...p, 
          type: 'post', 
          label: `New post: ${p.title}`, 
          author: Array.isArray(p.children) ? p.children[0]?.name : (p.children as any)?.name 
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentActivities(combined.slice(0, 5));

      // 4. Fetch Weekly Growth Data (Both parents and children)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [weeklyChildren, weeklyParents] = await Promise.all([
        supabase.from('children').select('created_at').gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('parents').select('created_at').gte('created_at', sevenDaysAgo.toISOString())
      ]);

      const growthData = Array(7).fill(0);
      const allNewUsers = [...(weeklyChildren.data || []), ...(weeklyParents.data || [])];
      
      allNewUsers.forEach(user => {
        // created_at is "2026-02-04 13:07:09.215157+00"
        // Replacing space with T to make it a standard ISO format for better JS parsing
        const isoString = user.created_at.replace(' ', 'T');
        const date = new Date(isoString);
        
        // Use IST for grouping to match other analytics
        const istDay = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})).getDay();
        
        // Adjust day to start from Monday (0) to Sunday (6)
        // .getDay() returns 0 for Sunday, 1 for Monday...
        const index = (istDay + 6) % 7;
        growthData[index]++;
      });

      // Convert counts to percentages for the chart height
      const maxCount = Math.max(...growthData, 1);
      const percentageData = growthData.map(count => Math.round((count / maxCount) * 100));
      setWeeklyGrowth(percentageData);

    } catch (error: any) {
      toast.error("Dashboard error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Total Community", value: stats.totalUsers, icon: Users, color: "text-brand-purple", bg: "bg-brand-purple/10", trend: "+12%" },
    { label: "Total Posts", value: stats.totalPosts, icon: FileText, color: "text-hot-pink", bg: "bg-hot-pink/10", trend: "+5.4%" },
    { label: "Active Kids", value: stats.activeChildren, icon: Zap, color: "text-sky-blue", bg: "bg-sky-blue/10", trend: "+8.1%" },
    { label: "Joined Today", value: stats.newToday, icon: UserPlus, color: "text-grass-green", bg: "bg-grass-green/10", trend: "New" },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 font-bold mt-1">Welcome back! Here's what's happening today at Qidzo.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl font-black text-sm text-gray-600 shadow-sm hover:border-brand-purple/20 transition-all">
                <Calendar className="w-4 h-4 text-brand-purple" />
                Feb 13, 2026
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/20 hover:bg-black transition-all">
                <Activity className="w-4 h-4" />
                Live View
            </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
            Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-36 bg-white rounded-[32px] border border-gray-100 animate-pulse" />
            ))
        ) : (
            statCards.map((card, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500 opacity-50" />
                    
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black bg-green-50 text-green-600 px-2.5 py-1 rounded-full border border-green-100">
                            {card.trend}
                        </span>
                    </div>
                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1 relative z-10">{card.label}</p>
                    <h3 className="text-3xl font-black text-gray-900 relative z-10">{card.value}</h3>
                </motion.div>
            ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Replacement for Community Growth - Recent Subscriptions/Growth Table */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900">Recent Community Growth</h3>
                    <p className="text-xs font-bold text-gray-400">Latest 5 user registrations across the platform</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><Filter className="w-5 h-5" /></button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                            <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="py-4"><div className="h-4 w-32 bg-gray-50 rounded" /></td>
                                    <td className="py-4"><div className="h-4 w-16 bg-gray-50 rounded" /></td>
                                    <td className="py-4"><div className="h-4 w-24 bg-gray-50 rounded" /></td>
                                    <td className="py-4"><div className="h-4 w-8 bg-gray-50 rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : recentActivities.filter(a => a.type === 'user').length > 0 ? (
                            recentActivities.filter(a => a.type === 'user').map((user, i) => (
                                <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-sky-blue/10 text-sky-blue flex items-center justify-center font-black text-xs">
                                                {user.name?.[0] || 'U'}
                                            </div>
                                            <span className="text-sm font-black text-gray-800">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-[10px] font-black px-2 py-1 bg-sky-blue/10 text-sky-blue rounded-lg uppercase tracking-wider">
                                            {user.type}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-xs font-bold text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button className="p-2 text-gray-300 group-hover:text-brand-purple transition-colors">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-10 text-center">
                                    <p className="text-sm font-bold text-gray-400">No recent users found.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Recent Activity (Live Feed) */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-hot-pink" />
                Live Feed
            </h3>
            <div className="space-y-6">
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
                    ))
                ) : recentActivities.length > 0 ? (
                    recentActivities.map((activity, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 group cursor-pointer"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                activity.type === 'user' ? 'bg-sky-blue/10 text-sky-blue' : 'bg-brand-purple/10 text-brand-purple'
                            } group-hover:scale-110 transition-transform`}>
                                {activity.type === 'user' ? <UserPlus className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-gray-800 truncate">{activity.label}</p>
                                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-50 rounded-xl transition-all">
                                <ArrowUpRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-10">
                        <p className="text-sm font-bold text-gray-400">No activity today yet.</p>
                    </div>
                )}
            </div>
            
            <button className="w-full mt-10 py-4 rounded-2xl bg-gray-50 text-gray-500 font-black text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                View All Activity
                <ArrowUpRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
}
