import { Heart, MessageCircle, Trophy, MoreHorizontal, Sparkles, Pencil, Trash2, X, AlertCircle, Link2, Share2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toggleLike, hasLikedPost } from "@/actions/likes";
import { deletePost, updatePost } from "@/actions/post";
import { getCategories, Category } from "@/actions/categories";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs"; // Parent check
import CommentsModal from "@/components/comments/CommentsModal";
import { FollowButton } from "@/components/FollowButton";

interface FeedPost {
  id: string;
  post_id: string;
  child_id: string;
  category_id: string;
  title: string | null;
  content: string;
  media_type: "IMAGE" | "VIDEO" | "NONE";
  media_url: string | null;
  media_thumbnail: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  child: {
    name: string;
    username: string;
    avatar: string | null;
    age: number;
    level: number;
  };
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

// Helper to render dynamic Lucide icons
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  let IconComponent = (LucideIcons as any)[name];
  if (!IconComponent && name) {
    const pascalName = name
      .split(/[-_ ]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
    IconComponent = (LucideIcons as any)[pascalName];
  }
  if (!IconComponent) return <Sparkles className={className} />;
  return <IconComponent className={className} />;
};

export default function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId?: string | null }) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  
  // Use a deterministic color if category color is missing or invalid
  const categoryColor = post.category?.color || "#8B5CF6";
  const avatarUrl = post.child?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.child?.username || "kid"}`;

  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(post.content);
  const [editCategoryId, setEditCategoryId] = useState(post.category_id);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const { isSignedIn: isParentSignedIn } = useUser();

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = () => setIsMenuOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);
  
  // Determine if the current user is the author of this post
  const isOwner = currentUserId === post.child_id;
  
  // Determine if we should show the follow button
  // Show if:
  // 1. User is not identified as the post author (guest, parent, or other child)
  // 2. Explicitly hide ONLY if currentUserId matches post.child_id
  const showFollowButton = !currentUserId || !isOwner;

  // Sync state with props when server data changes
  useEffect(() => {
    setLikesCount(post.likes_count);
  }, [post.likes_count]);

  useEffect(() => {
    setCommentsCount(post.comments_count);
  }, [post.comments_count]);

  // Check if liked on mount
  useEffect(() => {
    // Only check if we think we might be logged in (optimisation?)
    // Or just always check. 
    const checkLikeStatus = async () => {
        const liked = await hasLikedPost(post.post_id);
        setIsLiked(liked);
    };
    checkLikeStatus();
  }, [post.post_id]);

  // Fetch categories for edit modal
  useEffect(() => {
    if (isEditModalOpen && categories.length === 0) {
      getCategories().then(setCategories);
    }
  }, [isEditModalOpen, categories.length]);

  const handleLike = async () => {
    if (isLikeLoading) return;

    // Optimistic UI Update
    const prevIsLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevIsLiked);
    setLikesCount(prevIsLiked ? prevCount - 1 : prevCount + 1);
    setIsLikeLoading(true);

    try {
        const result = await toggleLike(post.post_id);
        
        if (!result.success) {
            // Revert on failure
            setIsLiked(prevIsLiked);
            setLikesCount(prevCount);
            
            if (result.error === "Must be logged in to like posts.") {
                 // Check if it's a parent trying to like
                 if (isParentSignedIn) {
                     // Should not happen if parent logic works, but just in case
                     toast.error("Could not verify parent session. Please refresh.");
                 } else {
                     toast.error("Please log in to like posts! 🔐");
                 }
            } else {
                toast.error("Oops! Couldn't like that post. 🐛");
            }
        } else {
            // Sync with server result just in case
            if (result.likesCount !== undefined) {
                setLikesCount(result.likesCount);
            }
            if (result.isLiked !== undefined) {
                setIsLiked(result.isLiked);
            }
            
            // Success toast removed as per request
        }
    } catch (err) {
        // Revert
        setIsLiked(prevIsLiked);
        setLikesCount(prevCount);
        toast.error("Something went wrong.");
    } finally {
        setIsLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const result = await deletePost(post.post_id, currentUserId);
      if (result.success) {
        toast.success("Post deleted successfully! ✨");
        setIsVisible(false);
      } else {
        toast.error("Oops! Failed to delete post. 🐛");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || isUpdating) return;

    if (!editContent.trim()) {
      toast.error("Post content cannot be empty! ✍️");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updatePost(post.post_id, currentUserId, {
        title: editTitle,
        content: editContent,
        categoryId: editCategoryId
      });

      if (result.success) {
        toast.success("Post updated successfully! 🌈");
        setIsEditModalOpen(false);
        // Note: The page will revalidate due to server action, 
        // but for immediate UI feedback we can also update local state if needed.
        // For now, revalidatePath in server action handles it.
      } else {
        toast.error("Failed to update post. 😢");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="bg-white rounded-3xl sm:rounded-[32px] shadow-xl shadow-gray-200/30 border-4 overflow-hidden mb-4 sm:mb-8 hover:shadow-2xl transition-all duration-300"
      style={{ borderColor: categoryColor }}
    >
      {/* Post Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={`/child/${post.child?.username}`} className="block relative group">
             <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-1 bg-gradient-to-br from-brand-purple to-hot-pink group-hover:scale-105 transition-transform duration-200">
               <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner relative">
                  <Image 
                    src={avatarUrl} 
                    alt={post.child?.name || "User"} 
                    fill
                    sizes="(max-width: 640px) 48px, 56px"
                    className="object-cover"
                  />
               </div>
             </div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
                <Link href={`/child/${post.child?.username}`} className="hover:underline decoration-brand-purple decoration-2 underline-offset-2">
                    <h3 className="font-nunito font-extrabold text-gray-900 text-base sm:text-lg leading-tight">
                      {post.child?.name}
                    </h3>
                 </Link>
                 {showFollowButton && (
                    <FollowButton targetId={post.child_id} targetType="CHILD" />
                 )}
             </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-lg bg-sunshine-yellow text-amber-900 text-[9px] sm:text-[10px] font-black uppercase">
                Lvl {post.child?.level || 1}
              </span>
              <p className="text-[10px] sm:text-xs font-bold text-gray-400">
                {timeAgo}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 relative">
          {isOwner && (
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className={cn(
                  "p-1.5 sm:p-2 rounded-full transition-all cursor-pointer active:scale-90",
                  isMenuOpen ? "bg-brand-purple/10 text-brand-purple" : "hover:bg-gray-50 text-gray-400"
                )}
              >
                {isMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <MoreHorizontal className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

              {/* Bubbly Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-xl shadow-brand-purple/10 border-2 border-gray-50 p-2 z-20 animate-in fade-in zoom-in duration-200">
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-purple/5 text-gray-700 hover:text-brand-purple rounded-xl transition-colors font-bold text-sm"
                  >
                    <div className="bg-brand-purple/10 p-1.5 rounded-lg">
                      <Pencil className="w-4 h-4" />
                    </div>
                    Edit Post
                  </button>
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-gray-700 hover:text-red-500 rounded-xl transition-colors font-bold text-sm mt-1"
                  >
                    <div className="bg-red-100 p-1.5 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </div>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div 
            className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1"
            style={{ backgroundColor: categoryColor }}
          >
            <DynamicIcon name={post.category?.icon} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {post.category?.name}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 sm:px-6 pb-3 sm:pb-4">
        {post.title && (
            <h4 className="font-black text-lg sm:text-xl mb-1.5 sm:mb-2 text-gray-900">{post.title}</h4>
        )}
        <p className="text-gray-800 font-bold text-base sm:text-lg leading-relaxed font-nunito whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post Media */}
      {post.media_type !== "NONE" && post.media_url && (
        <div
          className="relative w-full aspect-[4/3] bg-black/5 overflow-hidden group shadow-inner select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {post.media_type === "IMAGE" ? (
            <div className="relative w-full h-full">
              <Image
                src={post.media_url}
                alt="Post content"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                className="object-contain transition-transform duration-700 group-hover:scale-105"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          ) : (
            <video
              src={post.media_url}
              controls
              className="w-full h-full object-cover bg-black"
              poster={post.media_thumbnail || undefined}
              onContextMenu={(e) => e.preventDefault()}
              playsInline
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
            />
          )}
        </div>
      )}

        {/* Bottom Bar */}
        <div className="p-4 sm:p-5 flex items-center justify-between bg-gray-50/50 mt-1 sm:mt-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
                onClick={handleLike}
                disabled={isLikeLoading}
                className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full border-2 border-gray-100 hover:border-hot-pink transition-all group shadow-sm cursor-pointer active:scale-95",
                    isLiked ? "border-hot-pink text-hot-pink" : "text-gray-600"
                )}
            >
              <Heart 
                className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                    isLiked ? "fill-hot-pink text-hot-pink" : "text-gray-400 group-hover:text-hot-pink"
                )} 
              />
              <span className={cn(
                  "text-xs sm:text-sm font-black group-hover:text-hot-pink",
                  isLiked ? "text-hot-pink" : "text-gray-600"
              )}>
                  {likesCount || 0}
              </span>
            </button>
            <button 
              onClick={() => setIsCommentsOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full border-2 border-gray-100 hover:border-sky-blue hover:text-sky-blue transition-all group shadow-sm cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-sky-blue transition-colors" />
              <span className="text-xs sm:text-sm font-black text-gray-600 group-hover:text-sky-blue">{commentsCount || 0}</span>
            </button>
          </div>
          
          <button
            onClick={() => setIsShareOpen(true)}
            className="bg-brand-purple text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-nunito font-black text-xs sm:text-sm shadow-lg shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2"
          >
            Share Magic <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      {isShareOpen && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsShareOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-[28px] shadow-2xl border-4 border-white overflow-hidden animate-in slide-in-from-bottom-8 zoom-in duration-300">
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-hot-pink uppercase tracking-[0.18em] mb-0.5">
                  Share Magic
                </p>
                <h3 className="text-sm font-black text-gray-900 font-nunito">
                  Send this post to your friends ✨
                </h3>
              </div>
              <button
                onClick={() => setIsShareOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={async () => {
                    const origin =
                      typeof window !== "undefined" ? window.location.origin : "";
                    const shareUrl = `${origin}/child/${post.child.username}?postId=${post.post_id}`;
                    const text = `${post.child.name}'s magic on Qidzo ✨`;
                    const url = `https://wa.me/?text=${encodeURIComponent(
                      `${text} ${shareUrl}`
                    )}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  className="flex flex-col items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl py-3 cursor-pointer transition-all active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase tracking-wide">
                    WhatsApp
                  </span>
                </button>

                <button
                  onClick={async () => {
                    const origin =
                      typeof window !== "undefined" ? window.location.origin : "";
                    const shareUrl = `${origin}/child/${post.child.username}?postId=${post.post_id}`;
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied for Instagram 🎨", {
                      description: "Paste it in your story or bio to share the magic!",
                    });
                  }}
                  className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-hot-pink/10 to-sunshine-yellow/10 hover:from-hot-pink/20 hover:to-sunshine-yellow/20 text-hot-pink rounded-2xl py-3 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase tracking-wide">
                    Instagram
                  </span>
                </button>

                <button
                  onClick={async () => {
                    const origin =
                      typeof window !== "undefined" ? window.location.origin : "";
                    const shareUrl = `${origin}/child/${post.child.username}?postId=${post.post_id}`;
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Magic link copied! ✨");
                  }}
                  className="flex flex-col items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl py-3 cursor-pointer transition-all active:scale-95"
                >
                  <Link2 className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase tracking-wide">
                    Copy Link
                  </span>
                </button>
              </div>

              <button
                onClick={async () => {
                  const origin =
                    typeof window !== "undefined" ? window.location.origin : "";
                  const shareUrl = `${origin}/child/${post.child.username}?postId=${post.post_id}`;
                  const text = `${post.child.name}'s magic on Qidzo ✨`;

                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: text,
                        text,
                        url: shareUrl,
                      });
                    } catch {
                    }
                  } else {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Magic link copied! ✨");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-black text-white font-black text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>More ways to share</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <CommentsModal 
        postId={post.post_id} 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)}
        categoryColor={categoryColor}
        onCommentAdded={(count) => setCommentsCount(count)}
        onCommentDeleted={(count) => setCommentsCount(count)}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border-4 border-white animate-in zoom-in slide-in-from-bottom-8 duration-300">
            {/* Header with Warning Icon */}
            <div className="bg-red-50 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 rotate-3 border-2 border-red-100">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 font-nunito leading-tight">
                Wait! Are you sure?
              </h3>
            </div>

            {/* Body */}
            <div className="p-8 text-center">
              <p className="text-gray-600 font-bold mb-6 leading-relaxed">
                Deleting this post will remove it from the feed and you'll lose <span className="text-hot-pink">10 XP</span>. This cannot be undone! 😱
              </p>

              <div className="flex flex-col gap-3">
                <button
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Yes, Delete it! 🗑️</>
                  )}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  Oops, No! Keep it ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isUpdating && setIsEditModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border-4 border-white animate-in zoom-in slide-in-from-bottom-8 duration-300 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-brand-purple/5 p-6 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center rotate-3 border-2 border-brand-purple/10">
                  <Pencil className="w-6 h-6 text-brand-purple" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 font-nunito leading-tight">
                    Edit Post
                  </h3>
                  <p className="text-xs font-bold text-brand-purple/60 uppercase tracking-wider">Update your story! ✨</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Category Selection */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-700 ml-1">Choose Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.category_id}
                      type="button"
                      onClick={() => setEditCategoryId(cat.category_id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95",
                        editCategoryId === cat.category_id
                          ? "border-brand-purple bg-brand-purple/5 shadow-sm"
                          : "border-gray-100 hover:border-brand-purple/20 hover:bg-gray-50"
                      )}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} className="w-5 h-5" />
                      </div>
                      <span className={cn(
                        "text-xs font-bold truncate",
                        editCategoryId === cat.category_id ? "text-brand-purple" : "text-gray-600"
                      )}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Title (Optional)</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Give it a cool title! 🎈"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-brand-purple focus:ring-0 transition-all font-bold text-gray-700 outline-none"
                />
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">What's on your mind? *</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write something awesome... 📝"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-brand-purple focus:ring-0 transition-all font-bold text-gray-700 outline-none min-h-[120px] resize-none"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-4 bg-brand-purple hover:bg-brand-purple-dark text-white rounded-2xl font-black text-lg shadow-lg shadow-brand-purple/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Save Changes! 🌈</>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-4 px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
