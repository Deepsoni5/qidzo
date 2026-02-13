"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Trash2, 
  MoreVertical,
  User,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'CHILD' | 'PARENT'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          posts (title, media_url, post_id),
          children (name, username, avatar),
          parents (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch comments: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCommentStatus = async (commentId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_active: !currentStatus })
        .eq('id', commentId);
      
      if (error) throw error;
      
      setComments(comments.map(c => c.id === commentId ? { ...c, is_active: !currentStatus } : c));
      toast.success(`Comment ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setOpenMenuId(null);
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const deleteComment = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This action is permanent and cannot be undone.")) return;
    
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      
      setComments(comments.filter(c => c.id !== commentId));
      toast.success("Comment permanently deleted");
      setOpenMenuId(null);
    } catch (error: any) {
      toast.error("Deletion failed: " + error.message);
    }
  };

  const filteredComments = comments.filter(comment => {
    const searchMatch = (
      comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.posts?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      comment.children?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.parents?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const typeMatch = filterType === 'all' ? true : comment.user_type === filterType;
    const statusMatch = filterStatus === 'all' ? true : (filterStatus === 'active' ? comment.is_active : !comment.is_active);
    
    return searchMatch && typeMatch && statusMatch;
  });

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-brand-purple fill-brand-purple/20" />
            Comment Moderation
          </h1>
          <p className="text-gray-500 font-bold mt-1">Review and manage community discussions.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-brand-purple/10 px-6 py-3 rounded-2xl border border-brand-purple/20">
            <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest">Total Comments</p>
            <p className="text-2xl font-black text-brand-purple">{comments.length}</p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-purple transition-colors" />
          <input 
            type="text" 
            placeholder="Search by comment content, post or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-5 bg-white border-2 border-gray-50 rounded-[28px] font-bold text-gray-700 focus:border-brand-purple/20 outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-brand-purple/5"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
            >
              <option value="all">All User Types</option>
              <option value="CHILD">Children Only</option>
              <option value="PARENT">Parents Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comments Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Comment</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Post</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Author</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-10 bg-gray-50/50" />
                    </tr>
                  ))
                ) : filteredComments.length > 0 ? (
                  filteredComments.map((comment) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={comment.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6 max-w-sm">
                        <div className="space-y-1">
                          <p className="font-bold text-gray-900 leading-relaxed">{comment.content}</p>
                          <div className="flex items-center gap-2">
                            {comment.is_edited && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                <Edit2 className="w-3 h-3" /> Edited
                              </span>
                            )}
                            <p className="text-[10px] text-gray-400 font-bold">
                              {new Date(comment.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          {comment.posts?.media_url ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-gray-100">
                              <Image 
                                src={comment.posts.media_url} 
                                alt="" 
                                fill 
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                          )}
                          <div className="max-w-[150px]">
                            <p className="font-bold text-gray-900 truncate text-sm">{comment.posts?.title || "Untitled Post"}</p>
                            <p className="text-[10px] text-gray-400 font-bold">Ref: {comment.post_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                            {comment.user_type === 'CHILD' ? (
                              comment.children?.avatar ? (
                                <Image src={comment.children.avatar} alt="" width={40} height={40} className="object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-brand-purple" />
                              )
                            ) : (
                              <User className="w-5 h-5 text-pink-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {comment.user_type === 'CHILD' ? comment.children?.name : comment.parents?.name}
                            </p>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              comment.user_type === 'CHILD' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'
                            }`}>
                              {comment.user_type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          comment.is_active 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${comment.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {comment.is_active ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === comment.id ? null : comment.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          <AnimatePresence>
                            {openMenuId === comment.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-50 z-50 overflow-hidden"
                              >
                                <div className="py-2">
                                  <button 
                                    onClick={(e) => toggleCommentStatus(comment.id, comment.is_active, e)}
                                    className={`w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-3 transition-colors ${
                                      comment.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {comment.is_active ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                    {comment.is_active ? 'Hide Comment' : 'Show Comment'}
                                  </button>
                                  <button 
                                    onClick={(e) => deleteComment(comment.id, e)}
                                    className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Permanently
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-10 h-10 text-gray-200" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-black text-xl">No comments found</p>
                          <p className="text-gray-400 font-bold">Adjust your search or filters.</p>
                        </div>
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
  );
}
