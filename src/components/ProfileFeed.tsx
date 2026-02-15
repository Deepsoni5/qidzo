"use client";

import { useState, useEffect } from "react";
import { Grid, Image as ImageIcon, Video } from "lucide-react";
import PostCard from "@/components/PostCard";
import { FeedPost } from "@/actions/feed";
import { cn } from "@/lib/utils";
import { getCurrentUserRole } from "@/actions/auth";

interface ProfileFeedProps {
  posts: FeedPost[];
  profileName: string;
  highlightPostId?: string;
}

type TabType = "all" | "photos" | "videos";

export default function ProfileFeed({ posts, profileName, highlightPostId }: ProfileFeedProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const role = await getCurrentUserRole();
      const child = role.child as any;
      if (role.isChild && child && child.id) {
        setCurrentUserId(String(child.id));
      } 
    };
    fetchUser();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "all") return true;
    if (activeTab === "photos") return post.media_type === "IMAGE";
    if (activeTab === "videos") return post.media_type === "VIDEO";
    return true;
  });

  const orderedPosts =
    highlightPostId
      ? [...filteredPosts].sort((a, b) => {
          if (a.post_id === highlightPostId) return -1;
          if (b.post_id === highlightPostId) return 1;
          return 0;
        })
      : filteredPosts;

  useEffect(() => {
    if (!highlightPostId) return;
    const el = document.getElementById(`post-${highlightPostId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [highlightPostId, orderedPosts.length]);

  return (
    <div>
      {/* Content Tabs */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full font-black shadow-sm transition-all cursor-pointer whitespace-nowrap",
            activeTab === "all"
              ? "bg-black text-white shadow-lg scale-105"
              : "bg-white text-gray-500 border-2 border-gray-100 hover:bg-gray-50"
          )}
        >
          <Grid className="w-4 h-4" />
          All Magic
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full font-black shadow-sm transition-all cursor-pointer whitespace-nowrap",
            activeTab === "photos"
              ? "bg-hot-pink text-white shadow-lg shadow-hot-pink/20 scale-105 border-transparent"
              : "bg-white text-gray-500 border-2 border-gray-100 hover:bg-gray-50"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          Photos
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full font-black shadow-sm transition-all cursor-pointer whitespace-nowrap",
            activeTab === "videos"
              ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/20 scale-105 border-transparent"
              : "bg-white text-gray-500 border-2 border-gray-100 hover:bg-gray-50"
          )}
        >
          <Video className="w-4 h-4" />
          Videos
        </button>
      </div>

      <div className="space-y-6">
        {orderedPosts.length > 0 ? (
          orderedPosts.map((post) => (
            <div
              key={post.id}
              id={`post-${post.post_id}`}
              className={cn(
                highlightPostId === post.post_id
                  ? "ring-4 ring-brand-purple/40 rounded-[32px] scale-[1.01] transition-all duration-500"
                  : ""
              )}
            >
              <PostCard post={post} currentUserId={currentUserId} />
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-[32px] border-4 border-dashed border-gray-200">
            <div className="text-6xl mb-4 grayscale opacity-50">
              {activeTab === "photos" ? "📸" : activeTab === "videos" ? "🎥" : "🎨"}
            </div>
            <h3 className="text-xl font-black text-gray-800 font-nunito mb-2">
              No {activeTab === "all" ? "Magic" : activeTab === "photos" ? "Photos" : "Videos"} Yet!
            </h3>
            <p className="text-gray-500 font-bold max-w-xs mx-auto">
              {profileName} hasn't shared any {activeTab === "all" ? "magic" : activeTab} here yet.
            </p>
          </div>
        )}
      </div>

      {orderedPosts.length > 0 && (
        <div className="text-center py-8 text-gray-400 font-bold font-nunito">
          That's all the magic for now! ✨
        </div>
      )}
    </div>
  );
}
