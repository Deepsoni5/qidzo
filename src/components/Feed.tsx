"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/PostCard";
import { type FeedPost } from "@/actions/feed";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUserRole } from "@/actions/auth";
import { CreatePostModal } from "./CreatePostModal";
import { useFeedStore } from "@/store/feedStore";

export default function Feed() {
  const searchParams = useSearchParams();
  const categoryIds =
    searchParams.get("categories")?.split(",").filter(Boolean) || [];

  // Zustand store
  const { posts, hasMore, isLoading, loadMorePosts, setCategoryIds } =
    useFeedStore();

  const [userRole, setUserRole] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  // Get current user ID (for ownership check and follow button visibility)
  const currentUserId = userRole?.isChild
    ? (userRole.child.id as string)
    : userRole?.isSchool
      ? (userRole.school.id as string)
      : null;

  // Update category filter when URL changes
  useEffect(() => {
    setCategoryIds(categoryIds);
  }, [searchParams, setCategoryIds]);

  // Load user role
  useEffect(() => {
    const init = async () => {
      const roleData = await getCurrentUserRole();
      setUserRole(roleData);
    };
    init();
  }, []);

  const handleCreatePost = () => {
    if (!userRole) return;

    if (userRole.role === "guest") {
      toast.error("Please log in to create a post!");
      return;
    }

    if (userRole.isParent) {
      toast("Parents Mode! 🛡️", {
        description:
          "Parents can only view and react. Let the kids be the creators! 🎨",
        duration: 4000,
        style: {
          background: "#FDF2F8",
          border: "2px solid #EC4899",
          color: "#831843",
          fontSize: "16px",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "bold",
        },
        className: "rounded-2xl shadow-xl",
      });
      return;
    }

    if (userRole.isChild) {
      setIsCreateModalOpen(true);
    }
  };

  // Initial load when posts are empty
  useEffect(() => {
    if (posts.length === 0 && hasMore && !isLoading) {
      loadMorePosts();
    }
  }, [posts.length, hasMore, isLoading, loadMorePosts]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !isLoading && posts.length > 0) {
      loadMorePosts();
    }
  }, [inView, hasMore, isLoading, posts.length, loadMorePosts]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      {/* Loading State & Skeleton */}
      {(isLoading || hasMore) && (
        <div ref={ref} className="space-y-6">
          {/* Skeleton Post Card */}
          <div className="bg-white rounded-[32px] shadow-sm border-4 border-white p-5 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded-full" />
                <div className="h-3 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 w-full bg-gray-200 rounded-full" />
              <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
            </div>
            <div className="aspect-video bg-gray-200 rounded-2xl" />
          </div>

          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
            </div>
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="bg-gradient-to-br from-brand-purple/5 to-hot-pink/5 rounded-[32px] border-4 border-dashed border-gray-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-8 h-8 text-sunshine-yellow fill-sunshine-yellow animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 font-nunito mb-1">
              You've seen it all! 🌟
            </h3>
            <p className="text-gray-500 font-bold">
              Time to create your own magic?
            </p>
          </div>
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-purple to-hot-pink text-white px-8 py-3 rounded-full font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3px]" />
            Create Magic
          </button>
        </div>
      )}

      {!hasMore && posts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-black text-gray-800 font-nunito">
            No Magic Yet!
          </h3>
          <p className="text-gray-500 font-bold mb-6">
            Be the first to create something magical.
          </p>
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-purple to-hot-pink text-white px-8 py-3 rounded-full font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3px]" />
            Create First Magic
          </button>
        </div>
      )}

      {userRole?.isChild && userRole.child && (
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          childId={userRole.child.id}
        />
      )}
    </div>
  );
}
