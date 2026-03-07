"use client";

import { Phone, Video, Lock } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { canMakeVideoCalls } from "@/actions/video-calls";

interface CallButtonsProps {
  otherUserId: string;
}

export default function CallButtons({ otherUserId }: CallButtonsProps) {
  const [canCall, setCanCall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      const allowed = await canMakeVideoCalls();
      setCanCall(allowed);
      setIsLoading(false);
    }
    checkPermission();
  }, []);

  const handleVideoCall = () => {
    if (!canCall) {
      toast.error("Upgrade to PRO or ELITE plan to make video calls", {
        description: "Ask your parent to upgrade your plan",
      });
      return;
    }

    // Wait a bit for the global function to be available
    const tryCall = () => {
      if (
        typeof window !== "undefined" &&
        (window as any).qidzoStartVideoCall
      ) {
        (window as any).qidzoStartVideoCall(otherUserId);
      } else {
        // Retry after a short delay
        setTimeout(() => {
          if (
            typeof window !== "undefined" &&
            (window as any).qidzoStartVideoCall
          ) {
            (window as any).qidzoStartVideoCall(otherUserId);
          } else {
            toast.error("Video calls not ready yet. Please try again.");
          }
        }, 500);
      }
    };
    tryCall();
  };

  const handleAudioCall = () => {
    if (!canCall) {
      toast.error("Upgrade to PRO or ELITE plan to make audio calls", {
        description: "Ask your parent to upgrade your plan",
      });
      return;
    }

    // Wait a bit for the global function to be available
    const tryCall = () => {
      if (
        typeof window !== "undefined" &&
        (window as any).qidzoStartAudioCall
      ) {
        (window as any).qidzoStartAudioCall(otherUserId);
      } else {
        // Retry after a short delay
        setTimeout(() => {
          if (
            typeof window !== "undefined" &&
            (window as any).qidzoStartAudioCall
          ) {
            (window as any).qidzoStartAudioCall(otherUserId);
          } else {
            toast.error("Audio calls not ready yet. Please try again.");
          }
        }, 500);
      }
    };
    tryCall();
  };

  // Don't show buttons while loading
  if (isLoading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Audio Call Button */}
      <button
        onClick={handleAudioCall}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer relative ${
          canCall
            ? "bg-grass-green/10 hover:bg-grass-green/20 text-grass-green"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        title={canCall ? "Audio Call" : "Upgrade to PRO/ELITE for calls"}
      >
        <Phone className="w-4 h-4" />
        {!canCall && (
          <Lock className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-gray-500" />
        )}
      </button>

      {/* Video Call Button */}
      <button
        onClick={handleVideoCall}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer relative ${
          canCall
            ? "bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        title={canCall ? "Video Call" : "Upgrade to PRO/ELITE for calls"}
      >
        <Video className="w-4 h-4" />
        {!canCall && (
          <Lock className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-gray-500" />
        )}
      </button>
    </div>
  );
}
