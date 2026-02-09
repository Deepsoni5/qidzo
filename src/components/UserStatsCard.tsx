"use client";

import { useState } from "react";
import { refreshChildProfile, ChildProfile } from "@/actions/profile";
import { Trophy, MessageCircle, Heart, RotateCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface UserStatsCardProps {
  initialProfile: ChildProfile | null;
}

export function UserStatsCard({ initialProfile }: UserStatsCardProps) {
  const [profile, setProfile] = useState<ChildProfile | null>(initialProfile);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!profile) return;
    
    setIsRefreshing(true);
    try {
      const updatedProfile = await refreshChildProfile(profile.username);
      if (updatedProfile) {
        setProfile(updatedProfile);
        toast.success("Stats updated! ✨");
      }
    } catch (error) {
      console.error("Failed to refresh stats:", error);
      toast.error("Couldn't refresh stats.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!profile) {
    // Fallback for non-logged in or no profile users
    return (
      <div className="bg-white rounded-[32px] border-4 border-brand-purple/10 shadow-xl shadow-brand-purple/5 p-6 relative group w-full">
         {/* Decorative background blobs wrapper - using absolute positioning to avoid overflow issues on main container */}
         <div className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-purple/5 rounded-full blur-xl transition-all duration-500 group-hover:bg-brand-purple/10"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-hot-pink/5 rounded-full blur-xl transition-all duration-500 group-hover:bg-hot-pink/10"></div>
         </div>

         <div className="text-center py-2 relative z-10">
            <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
                🔐
            </div>
            <h3 className="font-nunito font-black text-xl text-gray-900 mb-2 leading-tight">
                Login To View<br/>Your Stats 📊
            </h3>
            <p className="text-sm text-gray-500 font-bold mb-6">
                Unlock your magic potential!
            </p>
            <Link 
                href="/login" 
                className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-brand-purple to-hot-pink text-white font-black py-3 px-6 rounded-xl shadow-lg shadow-brand-purple/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
            >
                Login Now 🚀
            </Link>
         </div>
      </div>
    );
  }

  const currentLevel = profile.level || 1;
  const currentXP = profile.xp_points || 0;
  const nextLevelXP = currentLevel * 1000; 
  const progress = Math.min((currentXP / nextLevelXP) * 100, 100);

  return (
    <div className="bg-white rounded-[32px] border-4 border-brand-purple/10 shadow-xl shadow-brand-purple/5 p-6 relative group">
      {/* Decorative background blobs */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-purple/5 rounded-full blur-xl pointer-events-none transition-all duration-500 group-hover:bg-brand-purple/10"></div>
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-hot-pink/5 rounded-full blur-xl pointer-events-none transition-all duration-500 group-hover:bg-hot-pink/10"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="font-nunito font-black text-2xl text-gray-900 leading-tight flex items-center gap-2">
            Your Magic <Sparkles className="w-5 h-5 text-sunshine-yellow animate-pulse" />
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
            @{profile.username}
          </p>
        </div>
        <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className={`p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/10 transition-all ${isRefreshing ? 'animate-spin text-brand-purple' : ''}`}
            title="Refresh Stats"
        >
            <RotateCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 relative z-10">
        {/* XP Bar */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-black text-gray-700">Level {currentLevel}</span>
            <span className="text-xs font-bold text-brand-purple">{currentXP} / {nextLevelXP} XP</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full p-1 shadow-inner border border-gray-50 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-purple to-hot-pink rounded-full shadow-sm transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
            {/* Total Likes */}
            <div className="bg-pink-50 rounded-2xl p-3 border border-pink-100 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform cursor-default">
                <Heart className="w-6 h-6 text-hot-pink fill-hot-pink/20" />
                <span className="font-black text-xl text-gray-800">{profile.total_likes_received || 0}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Likes Get</span>
            </div>

            {/* Total Comments */}
            <div className="bg-sky-50 rounded-2xl p-3 border border-sky-100 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform cursor-default">
                <MessageCircle className="w-6 h-6 text-sky-blue fill-sky-blue/20" />
                <span className="font-black text-xl text-gray-800">{profile.total_comments_made || 0}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Comments</span>
            </div>
        </div>
        
        {/* XP Points Summary (Small) */}
        <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-100 flex items-center justify-between px-4">
             <div className="flex items-center gap-3">
                <div className="bg-sunshine-yellow p-1.5 rounded-lg text-white shadow-sm">
                    <Trophy className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total XP</span>
             </div>
             <span className="font-black text-lg text-gray-800">{currentXP}</span>
        </div>

      </div>
    </div>
  );
}
