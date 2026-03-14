"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  Image as ImageIcon,
  Video,
  Type,
  Loader2,
  MessageSquare,
  Heart,
  Tag,
  Clock,
  X,
  ShieldCheck,
  ShieldAlert,
  School,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "IMAGE" | "VIDEO" | "NONE"
  >("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [filterPublisher, setFilterPublisher] = useState<
    "all" | "CHILD" | "SCHOOL"
  >("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    fetchPosts();
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          children (name, username, avatar),
          schools (name, logo_url, slug),
          categories (name, icon, color)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Use stored counts directly — no extra queries needed
      setPosts(postsData || []);
    } catch (error: any) {
      toast.error("Failed to fetch posts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePostVisibility = async (
    postId: string,
    currentStatus: boolean,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_active: !currentStatus })
        .eq("id", postId);
      if (error) throw error;
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, is_active: !currentStatus } : p,
        ),
      );
      toast.success(
        `Post ${!currentStatus ? "published" : "hidden"} successfully`,
      );
      setOpenMenuId(null);
      if (selectedPost?.id === postId)
        setSelectedPost({ ...selectedPost, is_active: !currentStatus });
    } catch (error: any) {
      toast.error("Status update failed: " + error.message);
    }
  };

  const deletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm("Are you sure? This action is permanent and cannot be undone.")
    )
      return;
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success("Post permanently deleted");
      setOpenMenuId(null);
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (error: any) {
      toast.error("Deletion failed: " + error.message);
    }
  };

  const getAuthorName = (post: any) =>
    post.publisher_type === "SCHOOL" ? post.schools?.name : post.children?.name;
  const getAuthorHandle = (post: any) =>
    post.publisher_type === "SCHOOL"
      ? post.schools?.slug
      : `@${post.children?.username}`;
  const getAuthorAvatar = (post: any) =>
    post.publisher_type === "SCHOOL"
      ? post.schools?.logo_url
      : post.children?.avatar;
  const getAuthorInitial = (post: any) =>
    (getAuthorName(post) || "?")[0]?.toUpperCase();

  const filteredPosts = posts.filter((post) => {
    const q = searchTerm.toLowerCase();
    const searchMatch =
      post.title?.toLowerCase().includes(q) ||
      post.content?.toLowerCase().includes(q) ||
      post.children?.name?.toLowerCase().includes(q) ||
      post.schools?.name?.toLowerCase().includes(q);
    const typeMatch = filterType === "all" || post.media_type === filterType;
    const statusMatch =
      filterStatus === "all" ||
      (filterStatus === "active" ? post.is_active : !post.is_active);
    const publisherMatch =
      filterPublisher === "all" || post.publisher_type === filterPublisher;
    return searchMatch && typeMatch && statusMatch && publisherMatch;
  });

  const childCount = posts.filter((p) => p.publisher_type === "CHILD").length;
  const schoolCount = posts.filter((p) => p.publisher_type === "SCHOOL").length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Content Moderation
          </h1>
          <p className="text-gray-500 font-bold mt-1">
            Audit, moderate and manage all community content.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-brand-purple/10 px-5 py-3 rounded-2xl border border-brand-purple/20 text-center">
            <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest">
              Total
            </p>
            <p className="text-2xl font-black text-brand-purple">
              {posts.length}
            </p>
          </div>
          <div className="bg-sky-blue/10 px-5 py-3 rounded-2xl border border-sky-blue/20 text-center">
            <p className="text-[10px] font-black text-sky-blue uppercase tracking-widest">
              Kids
            </p>
            <p className="text-2xl font-black text-sky-blue">{childCount}</p>
          </div>
          <div className="bg-grass-green/10 px-5 py-3 rounded-2xl border border-grass-green/20 text-center">
            <p className="text-[10px] font-black text-grass-green uppercase tracking-widest">
              Schools
            </p>
            <p className="text-2xl font-black text-grass-green">
              {schoolCount}
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-purple transition-colors" />
          <input
            type="text"
            placeholder="Search by title, content, child or school name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-5 bg-white border-2 border-gray-50 rounded-[28px] font-bold text-gray-700 focus:border-brand-purple/20 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Publisher filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
            <User className="w-4 h-4 text-gray-400" />
            <select
              value={filterPublisher}
              onChange={(e: any) => setFilterPublisher(e.target.value)}
              className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
            >
              <option value="all">All Publishers</option>
              <option value="CHILD">Kids Only</option>
              <option value="SCHOOL">Schools Only</option>
            </select>
          </div>
          {/* Media type filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
            >
              <option value="all">All Media</option>
              <option value="IMAGE">Images</option>
              <option value="VIDEO">Videos</option>
              <option value="NONE">Text Only</option>
            </select>
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Live</option>
              <option value="inactive">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-4 md:px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Content
                </th>
                <th className="hidden md:table-cell px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Author
                </th>
                <th className="hidden lg:table-cell px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Engagement
                </th>
                <th className="hidden xl:table-cell px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-4 md:px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-8 py-10 bg-gray-50/50" />
                      </tr>
                    ))
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={post.id}
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      {/* Content cell */}
                      <td className="px-4 md:px-8 py-6 max-w-[280px] md:max-w-md">
                        <div className="flex gap-3 md:gap-4">
                          <div className="relative shrink-0">
                            {post.media_url ? (
                              <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                                {post.media_type === "IMAGE" ? (
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={post.media_url}
                                      alt=""
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                    <Video className="w-6 h-6 text-white" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-brand-purple/5 flex items-center justify-center border-2 border-white shadow-sm">
                                <Type className="w-6 h-6 text-brand-purple/30" />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-lg shadow-sm border border-gray-50">
                              {post.media_type === "IMAGE" && (
                                <ImageIcon className="w-3 h-3 text-sky-blue" />
                              )}
                              {post.media_type === "VIDEO" && (
                                <Video className="w-3 h-3 text-hot-pink" />
                              )}
                              {post.media_type === "NONE" && (
                                <Type className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {/* Publisher type badge */}
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                  post.publisher_type === "SCHOOL"
                                    ? "bg-grass-green/10 text-grass-green"
                                    : "bg-sky-blue/10 text-sky-blue"
                                }`}
                              >
                                {post.publisher_type === "SCHOOL"
                                  ? "🏫 School"
                                  : "👦 Kid"}
                              </span>
                              {post.categories && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-widest">
                                  {post.categories.name}
                                </span>
                              )}
                              <span className="text-[9px] font-bold text-gray-300 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-black text-gray-900 leading-tight truncate md:text-lg">
                              {post.title || "Untitled Post"}
                            </h3>
                            <p className="text-xs md:text-sm font-bold text-gray-400 mt-1 line-clamp-2">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 md:hidden">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                  post.is_active
                                    ? "bg-green-100 text-green-600"
                                    : "bg-orange-100 text-orange-600"
                                }`}
                              >
                                {post.is_active ? "Live" : "Hidden"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Author cell */}
                      <td className="hidden md:table-cell px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border-2 border-white shadow-sm overflow-hidden shrink-0 ${
                              post.publisher_type === "SCHOOL"
                                ? "bg-grass-green/10 text-grass-green"
                                : "bg-brand-purple/10 text-brand-purple"
                            }`}
                          >
                            {getAuthorAvatar(post) ? (
                              <Image
                                src={getAuthorAvatar(post)}
                                alt=""
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getAuthorInitial(post)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 text-sm truncate">
                              {getAuthorName(post)}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold truncate">
                              {getAuthorHandle(post)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Engagement cell */}
                      <td className="hidden lg:table-cell px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              Likes
                            </span>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-hot-pink fill-hot-pink/10" />
                              <span className="font-black text-gray-900">
                                {post.likes_count || 0}
                              </span>
                            </div>
                          </div>
                          <div className="w-px h-6 bg-gray-100" />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              Comments
                            </span>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-sky-blue fill-sky-blue/10" />
                              <span className="font-black text-gray-900">
                                {post.comments_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status cell */}
                      <td className="hidden xl:table-cell px-8 py-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black border-2 ${
                            post.is_active
                              ? "bg-green-50 text-green-600 border-green-100"
                              : "bg-orange-50 text-orange-600 border-orange-100"
                          }`}
                        >
                          {post.is_active ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          )}
                          {post.is_active ? "LIVE" : "HIDDEN"}
                        </span>
                      </td>

                      {/* Actions cell */}
                      <td className="px-4 md:px-8 py-6 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === post.id ? null : post.id,
                            );
                          }}
                          className="p-2 md:p-3 hover:bg-white rounded-2xl transition-all group-hover:shadow-md text-gray-400"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                          {openMenuId === post.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-4 md:right-8 top-16 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[100] p-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) =>
                                  togglePostVisibility(
                                    post.id,
                                    post.is_active,
                                    e,
                                  )
                                }
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black transition-all mb-1 cursor-pointer ${
                                  post.is_active
                                    ? "text-orange-600 hover:bg-orange-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {post.is_active ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                                {post.is_active ? "Hide Post" : "Publish Post"}
                              </button>
                              <button
                                onClick={() => setSelectedPost(post)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-50 transition-all mb-1 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <div className="h-px bg-gray-50 my-2" />
                              <button
                                onClick={(e) => deletePost(post.id, e)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 transition-all cursor-pointer"
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
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                          <FileText className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold">
                          No posts found matching your criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Media Preview */}
              <div className="w-full md:w-1/2 bg-gray-50 relative min-h-[300px] flex items-center justify-center">
                {selectedPost.media_url ? (
                  selectedPost.media_type === "IMAGE" ? (
                    <div className="relative w-full h-full min-h-[400px]">
                      <Image
                        src={selectedPost.media_url}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center min-h-[400px]">
                      <Video className="w-20 h-20 text-white/20" />
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-4 text-gray-300">
                    <Type className="w-20 h-20" />
                    <p className="font-black text-sm uppercase tracking-widest">
                      Text Only Post
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setSelectedPost(null)}
                  className="md:hidden absolute top-6 right-6 p-3 bg-black/20 hover:bg-black/30 rounded-2xl text-white transition-all backdrop-blur-sm z-10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Info Panel */}
              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 border-white shadow-md overflow-hidden shrink-0 ${
                        selectedPost.publisher_type === "SCHOOL"
                          ? "bg-grass-green/10 text-grass-green"
                          : "bg-brand-purple/10 text-brand-purple"
                      }`}
                    >
                      {getAuthorAvatar(selectedPost) ? (
                        <Image
                          src={getAuthorAvatar(selectedPost)}
                          alt=""
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getAuthorInitial(selectedPost)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 leading-tight">
                          {getAuthorName(selectedPost)}
                        </p>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                            selectedPost.publisher_type === "SCHOOL"
                              ? "bg-grass-green/10 text-grass-green"
                              : "bg-sky-blue/10 text-sky-blue"
                          }`}
                        >
                          {selectedPost.publisher_type === "SCHOOL"
                            ? "School"
                            : "Kid"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-400">
                        {getAuthorHandle(selectedPost)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="hidden md:flex p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-5 flex-1">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {selectedPost.categories && (
                        <span className="px-3 py-1 rounded-lg bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase tracking-widest border border-brand-purple/10">
                          {selectedPost.categories.name}
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          selectedPost.is_active
                            ? "bg-green-50 text-green-600 border-green-100"
                            : "bg-orange-50 text-orange-600 border-orange-100"
                        }`}
                      >
                        {selectedPost.is_active ? "Live" : "Hidden"}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3">
                      {selectedPost.title || "Untitled Post"}
                    </h2>
                    <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-gray-600 font-bold leading-relaxed whitespace-pre-wrap">
                        {selectedPost.content}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-hot-pink/5 rounded-2xl border border-hot-pink/10 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-hot-pink/10 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-hot-pink fill-hot-pink/20" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-hot-pink">
                          {selectedPost.likes_count || 0}
                        </p>
                        <p className="text-[10px] font-black text-hot-pink/60 uppercase tracking-widest">
                          Likes
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-sky-blue/5 rounded-2xl border border-sky-blue/10 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-blue/10 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-sky-blue fill-sky-blue/20" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-sky-blue">
                          {selectedPost.comments_count || 0}
                        </p>
                        <p className="text-[10px] font-black text-sky-blue/60 uppercase tracking-widest">
                          Comments
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Metadata
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(selectedPost.created_at).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        {selectedPost.post_id}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-auto border-t border-gray-50">
                  <button
                    onClick={(e) =>
                      togglePostVisibility(
                        selectedPost.id,
                        selectedPost.is_active,
                        e,
                      )
                    }
                    className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all shadow-lg cursor-pointer ${
                      selectedPost.is_active
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    {selectedPost.is_active
                      ? "Hide from Feed"
                      : "Publish to Feed"}
                  </button>
                  <button
                    onClick={(e) => deletePost(selectedPost.id, e)}
                    className="px-6 py-4 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                  >
                    Delete
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
