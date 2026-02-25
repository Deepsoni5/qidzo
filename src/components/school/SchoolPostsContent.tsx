"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Loader2,
  ImageIcon,
  FileText,
  Calendar,
  TrendingUp,
} from "lucide-react";
import SchoolCreatePostModal from "./SchoolCreatePostModal";
import { getSchoolPosts, getSchoolProfile } from "@/actions/school";
import { toast } from "sonner";

export default function SchoolPostsContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    totalEngagement: 0,
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const schoolData = await getSchoolProfile();
      if (!schoolData) {
        toast.error("School not found");
        return;
      }

      const postsData = await getSchoolPosts(schoolData.id);
      setPosts(postsData);

      // Calculate stats
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthPosts = postsData.filter(
        (p: any) => new Date(p.created_at) >= thisMonthStart,
      );
      const totalEngagement = postsData.reduce(
        (sum: number, p: any) =>
          sum + (p.likes_count || 0) + (p.comments_count || 0),
        0,
      );

      setStats({
        total: postsData.length,
        thisMonth: thisMonthPosts.length,
        totalEngagement,
      });
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black font-nunito text-gray-900 tracking-tight">
            Post Magic ✨
          </h1>
          <p className="text-gray-500 font-bold mt-1">
            Create and manage your school's posts
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-blue to-brand-purple text-white font-black shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: "Total Posts",
            value: stats.total,
            icon: FileText,
            color: "sky-blue",
            bg: "bg-sky-blue/10",
          },
          {
            label: "This Month",
            value: stats.thisMonth,
            icon: Calendar,
            color: "brand-purple",
            bg: "bg-brand-purple/10",
          },
          {
            label: "Total Engagement",
            value: stats.totalEngagement,
            icon: TrendingUp,
            color: "grass-green",
            bg: "bg-grass-green/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon
                  className="w-6 h-6"
                  style={{
                    color:
                      stat.color === "sky-blue"
                        ? "#0EA5E9"
                        : stat.color === "brand-purple"
                          ? "#8B5CF6"
                          : "#10B981",
                  }}
                />
              </div>
              <div>
                <p className="text-2xl font-black font-nunito text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-blue" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 border border-gray-100 text-center">
          <div className="w-20 h-20 rounded-3xl bg-sky-blue/10 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-sky-blue" />
          </div>
          <h3 className="text-xl font-black font-nunito text-gray-900 mb-2">
            No Posts Yet
          </h3>
          <p className="text-sm font-bold text-gray-500 mb-6">
            Start sharing updates with your community!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-blue text-white font-black shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black font-nunito text-gray-900 mb-6">
            Your Posts
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
              >
                {post.media_url && post.media_type === "IMAGE" && (
                  <img
                    src={post.media_thumbnail || post.media_url}
                    alt={post.title || "Post"}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                )}
                {post.media_type === "DOCUMENT" && (
                  <div className="w-20 h-20 rounded-xl bg-grass-green/10 flex items-center justify-center shrink-0">
                    <FileText className="w-8 h-8 text-grass-green" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {post.title && (
                    <h3 className="text-base font-black text-gray-900 mb-1 truncate">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-sm font-bold text-gray-600 line-clamp-2 mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                    <span>{post.category?.name}</span>
                    <span>•</span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span>•</span>
                    <span>{post.likes_count || 0} likes</span>
                    <span>•</span>
                    <span>{post.comments_count || 0} comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      <SchoolCreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePostCreated}
      />
    </div>
  );
}
