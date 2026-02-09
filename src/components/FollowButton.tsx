"use client";

import { useState, useEffect } from "react";
import { toggleFollow, getFollowStatus } from "@/actions/follow";
import { toast } from "sonner";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetId: string;
  targetType: 'PARENT' | 'CHILD';
  className?: string;
}

export function FollowButton({ targetId, targetType, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const status = await getFollowStatus(targetId, targetType);
        if (mounted) {
          setIsFollowing(status);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to check follow status", error);
        if (mounted) setIsLoading(false);
      }
    };
    checkStatus();

    // Listen for global follow updates to sync multiple buttons for the same user
    const handleFollowUpdate = (e: CustomEvent<{ targetId: string; isFollowing: boolean }>) => {
      if (e.detail.targetId === targetId) {
        setIsFollowing(e.detail.isFollowing);
      }
    };

    window.addEventListener('qidzo:follow-update' as any, handleFollowUpdate);

    return () => { 
      mounted = false;
      window.removeEventListener('qidzo:follow-update' as any, handleFollowUpdate);
    };
  }, [targetId, targetType]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if inside a Link
    e.stopPropagation();
    
    if (isPending) return;

    // Optimistic Update
    const prevIsFollowing = isFollowing;
    const newIsFollowing = !prevIsFollowing;
    
    setIsFollowing(newIsFollowing);
    setIsPending(true);

    // Notify other components immediately
    window.dispatchEvent(new CustomEvent('qidzo:follow-update', { 
      detail: { targetId, isFollowing: newIsFollowing } 
    }));

    try {
      const result = await toggleFollow(targetId, targetType);
      
      if (!result.success) {
        // Revert
        setIsFollowing(prevIsFollowing);
        // Revert other components
        window.dispatchEvent(new CustomEvent('qidzo:follow-update', { 
          detail: { targetId, isFollowing: prevIsFollowing } 
        }));

        if (result.error === "Must be logged in to follow users.") {
             toast.error("Please login to follow! 🔐");
        } else if (result.error === "You cannot follow yourself.") {
             toast.error("You can't follow yourself! 😅");
        } else {
             toast.error("Something went wrong.");
        }
      } else {
        if (result.isFollowing) {
            toast.success("Followed! 🌟");
        } else {
            toast.success("Unfollowed");
        }
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(prevIsFollowing);
      window.dispatchEvent(new CustomEvent('qidzo:follow-update', { 
        detail: { targetId, isFollowing: prevIsFollowing } 
      }));
      toast.error("Failed to update follow status");
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("w-6 h-6 flex items-center justify-center", className)}>
         <div className="w-4 h-4 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
      </div>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black transition-all duration-200 active:scale-95 shadow-sm border cursor-pointer",
        isFollowing 
          ? "bg-white text-gray-500 border-gray-200 hover:border-red-100 hover:text-red-500 hover:bg-red-50" 
          : "bg-brand-purple text-white border-brand-purple hover:bg-brand-purple/90 hover:shadow-md",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isFollowing ? (
        <>
           <span className="hidden sm:inline">Following</span>
           <span className="sm:hidden"><UserCheck className="w-3 h-3" /></span>
        </>
      ) : (
        <>
           <span className="hidden sm:inline">Follow</span>
           <span className="sm:hidden"><UserPlus className="w-3 h-3" /></span>
        </>
      )}
    </button>
  );
}
