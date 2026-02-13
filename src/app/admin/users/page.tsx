"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Ban, 
  CheckCircle, 
  User, 
  Mail, 
  Calendar,
  ChevronRight,
  UserCheck,
  UserX,
  Loader2,
  Trophy,
  Zap,
  Clock,
  BookOpen,
  CreditCard,
  Shield,
  Eye,
  Smartphone,
  X,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'parents' | 'children'>('parents');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'FREE' | 'BASIC' | 'PREMIUM' | 'FAMILY'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'xp' | 'level'>('newest');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeTab, sortBy]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from(activeTab).select('*');
      
      if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
      else if (sortBy === 'name') query = query.order('name', { ascending: true });
      else if (sortBy === 'xp' && activeTab === 'children') query = query.order('xp_points', { ascending: false });
      else if (sortBy === 'level' && activeTab === 'children') query = query.order('level', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from(activeTab)
        .update({ is_active: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setOpenMenuId(null);
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_active: !currentStatus });
      }
    } catch (error: any) {
      toast.error("Status update failed: " + error.message);
    }
  };

  const deleteUser = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This action is permanent and will remove all associated data.")) return;
    
    try {
      const { error } = await supabase.from(activeTab).delete().eq('id', userId);
      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== userId));
      toast.success("User permanently removed");
      setOpenMenuId(null);
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (error: any) {
      toast.error("Deletion failed: " + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const usernameMatch = user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = activeTab === 'parents' && user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const searchMatch = nameMatch || usernameMatch || emailMatch;
    
    const statusMatch = filterStatus === 'all' ? true : 
                       (filterStatus === 'active' ? user.is_active : !user.is_active);
    
    const planMatch = activeTab === 'parents' ? (filterPlan === 'all' || user.subscription_plan === filterPlan) : true;
    
    return searchMatch && statusMatch && planMatch;
  });

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 font-bold mt-1">Audit, moderate and manage your growing community.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[24px] shadow-sm border border-gray-100">
          <button 
            onClick={() => { setActiveTab('parents'); setFilterPlan('all'); }}
            className={`px-8 py-3 rounded-[18px] font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'parents' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Shield className="w-4 h-4" />
            Parents
          </button>
          <button 
            onClick={() => setActiveTab('children')}
            className={`px-8 py-3 rounded-[18px] font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'children' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Zap className="w-4 h-4" />
            Children
          </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-purple transition-colors" />
          <input 
            type="text" 
            placeholder={`Search by name, username${activeTab === 'parents' ? ' or email' : ''}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-5 bg-white border-2 border-gray-50 rounded-[28px] font-bold text-gray-700 focus:border-brand-purple/20 outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-brand-purple/5"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Banned</option>
            </select>
          </div>

          {activeTab === 'parents' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <select 
                value={filterPlan}
                onChange={(e: any) => setFilterPlan(e.target.value)}
                className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
              >
                <option value="all">All Plans</option>
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
                <option value="FAMILY">Family</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <select 
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
              {activeTab === 'children' && (
                <>
                  <option value="xp">Highest XP</option>
                  <option value="level">Highest Level</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-4 md:px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                  <th className="hidden md:table-cell px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="hidden lg:table-cell px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {activeTab === 'parents' ? 'Subscription' : 'Activity Stats'}
                  </th>
                  <th className="hidden xl:table-cell px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Date</th>
                  <th className="px-4 md:px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-8 py-8 h-24 bg-gray-50/50" />
                      </tr>
                    ))
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={user.id} 
                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="px-4 md:px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 md:w-14 md:h-14 rounded-[16px] md:rounded-[20px] bg-gradient-to-br from-brand-purple/10 to-sky-blue/10 flex items-center justify-center font-black text-brand-purple text-base md:text-xl border-2 border-white shadow-md overflow-hidden">
                                {user.avatar ? (
                                  <Image src={user.avatar} alt={user.name} width={56} height={56} className="w-full h-full object-cover" />
                                ) : (
                                  user.name?.[0] || '?'
                                )}
                              </div>
                              {user.is_active && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 md:w-5 md:h-5 bg-green-500 border-2 md:border-4 border-white rounded-full shadow-sm" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-gray-900 text-base md:text-lg leading-tight truncate">{user.name}</p>
                              <p className="text-xs md:text-sm font-bold text-gray-400 truncate">@{user.username || user.id.slice(0, 8)}</p>
                              <div className="md:hidden mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black border ${
                                  user.is_active 
                                    ? 'bg-green-50 text-green-600 border-green-100' 
                                    : 'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                  {user.is_active ? 'ACTIVE' : 'BANNED'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black border-2 ${
                            user.is_active 
                              ? 'bg-green-50 text-green-600 border-green-100' 
                              : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {user.is_active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            {user.is_active ? 'ACTIVE' : 'BANNED'}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-8 py-6">
                          {activeTab === 'parents' ? (
                            <div className="space-y-1">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${
                                user.subscription_plan === 'PREMIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                user.subscription_plan === 'FAMILY' ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' :
                                'bg-gray-100 text-gray-500 border-gray-200'
                              }`}>
                                {user.subscription_plan || 'FREE'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</span>
                                <div className="flex items-center gap-1.5">
                                  <Zap className="w-4 h-4 text-sky-blue fill-sky-blue/20" />
                                  <span className="font-black text-gray-900">{user.level || 1}</span>
                                </div>
                              </div>
                              <div className="w-px h-8 bg-gray-100" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">XP</span>
                                <span className="font-black text-gray-900">{user.xp_points || 0}</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="hidden xl:table-cell px-8 py-6">
                          <p className="text-sm font-bold text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-300" />
                            {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-4 md:px-8 py-6 text-right relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === user.id ? null : user.id); }}
                            className="p-2 md:p-3 hover:bg-white rounded-2xl transition-all group-hover:shadow-md"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>

                          <AnimatePresence>
                            {openMenuId === user.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-4 md:right-8 top-16 w-48 md:w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[100] p-2 md:p-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button 
                                  onClick={() => setSelectedUser(user)}
                                  className="w-full flex items-center gap-3 px-4 py-3 md:py-3.5 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-50 transition-all mb-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </button>
                                <button 
                                  onClick={(e) => toggleUserStatus(user.id, user.is_active, e)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 md:py-3.5 rounded-2xl text-sm font-black transition-all mb-1 ${
                                    user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                                  }`}
                                >
                                  {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                  {user.is_active ? 'Ban User' : 'Unban User'}
                                </button>
                                <div className="h-px bg-gray-50 my-1 md:my-2" />
                                <button 
                                  onClick={(e) => deleteUser(user.id, e)}
                                  className="w-full flex items-center gap-3 px-4 py-3 md:py-3.5 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Permanently
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 md:w-20 h-16 md:h-20 bg-gray-50 rounded-full flex items-center justify-center">
                            <Search className="w-8 md:w-10 h-8 md:h-10 text-gray-200" />
                          </div>
                          <p className="text-gray-400 font-bold text-sm md:text-base">No users found matching your criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative h-48 bg-gradient-to-br from-brand-purple to-sky-blue p-10 flex items-end">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-8 right-8 p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition-all backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-6 translate-y-16">
                  <div className="w-32 h-32 rounded-[40px] bg-white p-1.5 shadow-2xl">
                    <div className="w-full h-full rounded-[34px] bg-gray-100 flex items-center justify-center font-black text-4xl text-brand-purple overflow-hidden">
                      {selectedUser.avatar ? (
                        <div className="relative w-full h-full">
                          <Image src={selectedUser.avatar} alt={selectedUser.name} fill className="object-cover" />
                        </div>
                      ) : (
                        selectedUser.name?.[0] || '?'
                      )}
                    </div>
                  </div>
                  <div className="pb-4">
                    <h2 className="text-4xl font-black text-white drop-shadow-sm">{selectedUser.name}</h2>
                    <p className="text-white/80 font-bold">@{selectedUser.username || selectedUser.id.slice(0, 8)}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="pt-24 px-10 pb-10 space-y-10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${selectedUser.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <p className="font-black text-gray-900">{selectedUser.is_active ? 'Active' : 'Banned'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Date</p>
                    <div className="flex items-center gap-2 text-gray-900 font-black">
                      <Calendar className="w-4 h-4 text-brand-purple" />
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {activeTab === 'parents' ? (
                    <>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</p>
                        <div className="flex items-center gap-2 text-gray-900 font-black">
                          <CreditCard className="w-4 h-4 text-brand-purple" />
                          {selectedUser.subscription_plan || 'FREE'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subscription Status</p>
                        <div className="flex items-center gap-2 text-gray-900 font-black">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          {selectedUser.subscription_status || 'ACTIVE'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ends At</p>
                        <div className="flex items-center gap-2 text-gray-900 font-black text-xs">
                          {selectedUser.subscription_ends_at ? new Date(selectedUser.subscription_ends_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                        <p className="font-black text-gray-900 text-sm">{selectedUser.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                        <p className="font-black text-gray-900 text-sm">{selectedUser.phone || 'Not provided'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Birth Date</p>
                        <p className="font-black text-gray-900 text-sm">{selectedUser.date_of_birth || 'Not provided'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Level / XP</p>
                        <div className="flex items-center gap-2 text-gray-900 font-black">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          Lvl {selectedUser.level} • {selectedUser.xp_points} XP
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Learning Hours</p>
                        <div className="flex items-center gap-2 text-gray-900 font-black">
                          <Clock className="w-4 h-4 text-sky-blue" />
                          {(selectedUser.learning_hours || 0).toFixed(1)} hrs
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age / Gender</p>
                        <div className="flex items-center gap-2 text-gray-900 font-black">
                          <User className="w-4 h-4 text-hot-pink" />
                          {selectedUser.age || '?'} yrs • {selectedUser.gender || 'Other'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Birth Date</p>
                        <p className="font-black text-gray-900 text-sm">{selectedUser.birth_date || 'Not provided'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferred Topics</p>
                        <p className="font-black text-gray-900 text-xs truncate max-w-[150px]">
                          {selectedUser.preferred_categories?.join(', ') || 'None selected'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {activeTab === 'children' && selectedUser.bio && (
                  <div className="space-y-2 p-6 bg-gray-50 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">About / Bio</p>
                    <p className="text-sm font-bold text-gray-600 italic">"{selectedUser.bio}"</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={(e) => toggleUserStatus(selectedUser.id, selectedUser.is_active, e)}
                    className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${
                      selectedUser.is_active 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 shadow-red-200/20' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100 shadow-green-200/20'
                    }`}
                  >
                    {selectedUser.is_active ? 'Ban Account' : 'Unban Account'}
                  </button>
                  <button 
                    onClick={(e) => deleteUser(selectedUser.id, e)}
                    className="px-8 py-4 rounded-2xl bg-gray-900 text-white font-black text-sm hover:bg-black transition-all shadow-lg shadow-gray-900/20"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

