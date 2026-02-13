"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Heart, 
  Search, 
  Filter, 
  Trash2, 
  MoreVertical,
  User,
  ExternalLink,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminLikesPage() {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'child' | 'parent'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchLikes();
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchLikes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          posts (title, media_url, post_id),
          children (name, username, avatar),
          parents (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLikes(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch likes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteLike = async (likeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this like?")) return;
    
    try {
      const { error } = await supabase.from('likes').delete().eq('id', likeId);
      if (error) throw error;
      
      setLikes(likes.filter(l => l.id !== likeId));
      toast.success("Like removed successfully");
      setOpenMenuId(null);
    } catch (error: any) {
      toast.error("Failed to remove like: " + error.message);
    }
  };

  const filteredLikes = likes.filter(like => {
    const searchMatch = (
      like.posts?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      like.children?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      like.parents?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const typeMatch = filterType === 'all' ? true : (filterType === 'child' ? like.child_id : like.parent_id);
    
    return searchMatch && typeMatch;
  });

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Heart className="w-10 h-10 text-pink-500 fill-pink-500" />
            Engagement Logs
          </h1>
          <p className="text-gray-500 font-bold mt-1">Monitor community interactions and likes.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-pink-500/10 px-6 py-3 rounded-2xl border border-pink-500/20">
            <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest">Total Likes</p>
            <p className="text-2xl font-black text-pink-600">{likes.length}</p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-pink-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by post title or user name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-5 bg-white border-2 border-gray-50 rounded-[28px] font-bold text-gray-700 focus:border-pink-500/20 outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-pink-500/5"
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
              <option value="all">All Users</option>
              <option value="child">Children Only</option>
              <option value="parent">Parents Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Likes Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Post</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Liked By</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
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
                ) : filteredLikes.length > 0 ? (
                  filteredLikes.map((like) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={like.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {like.posts?.media_url ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden relative border-2 border-gray-100">
                              <Image 
                                src={like.posts.media_url} 
                                alt="" 
                                fill 
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                              <Heart className="w-5 h-5" />
                            </div>
                          )}
                          <div className="max-w-[200px]">
                            <p className="font-bold text-gray-900 truncate">{like.posts?.title || "Untitled Post"}</p>
                            <p className="text-[10px] text-gray-400 font-bold">Ref: {like.post_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                            {like.child_id ? (
                              like.children?.avatar ? (
                                <Image src={like.children.avatar} alt="" width={40} height={40} className="object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-brand-purple" />
                              )
                            ) : (
                              <User className="w-5 h-5 text-pink-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {like.child_id ? like.children?.name : like.parents?.name}
                            </p>
                            <p className="text-xs text-gray-400 font-medium">
                              {like.child_id ? `@${like.children?.username}` : like.parents?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          like.child_id 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-pink-100 text-pink-600'
                        }`}>
                          {like.child_id ? 'Child' : 'Parent'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-600">
                          {new Date(like.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold">
                          {new Date(like.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === like.id ? null : like.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          <AnimatePresence>
                            {openMenuId === like.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-50 z-50 overflow-hidden"
                              >
                                <div className="py-2">
                                  <button 
                                    onClick={(e) => deleteLike(like.id, e)}
                                    className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Remove Like
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
                          <Heart className="w-10 h-10 text-gray-200" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-black text-xl">No likes found</p>
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
