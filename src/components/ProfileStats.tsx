"use client";

import { useState } from "react";
import { Users, UserCheck } from "lucide-react";
import FollowListModal from "./FollowListModal";

interface ProfileStatsProps {
  totalPosts: number;
  followersCount: number;
  followingCount: number;
  xpPoints: number;
  targetId: string;
  targetType: "CHILD" | "PARENT" | "SCHOOL";
}

export default function ProfileStats({
  totalPosts,
  followersCount,
  followingCount,
  xpPoints,
  targetId,
  targetType,
}: ProfileStatsProps) {
  const [modalType, setModalType] = useState<"FOLLOWERS" | "FOLLOWING" | null>(
    null,
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {/* Magic Created */}
        <div className="bg-sky-50/50 rounded-2xl p-4 text-center border-2 border-sky-100 hover:border-sky-200 transition-colors group cursor-default">
          <div className="text-sky-500 font-black text-2xl group-hover:scale-110 transition-transform duration-300">
            {totalPosts}
          </div>
          <div className="text-sky-900/60 text-xs font-bold uppercase tracking-wide">
            Magic Created
          </div>
        </div>

        {/* Followers */}
        <button
          onClick={() => setModalType("FOLLOWERS")}
          className="bg-brand-purple/5 rounded-2xl p-4 text-center border-2 border-brand-purple/10 hover:border-brand-purple/20 transition-all group cursor-pointer active:scale-95"
        >
          <div className="text-brand-purple font-black text-2xl group-hover:scale-110 transition-transform duration-300">
            {followersCount}
          </div>
          <div className="text-brand-purple/60 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Followers
          </div>
        </button>

        {/* Following */}
        <button
          onClick={() => setModalType("FOLLOWING")}
          className="bg-hot-pink/5 rounded-2xl p-4 text-center border-2 border-hot-pink/10 hover:border-hot-pink/20 transition-all group cursor-pointer active:scale-95"
        >
          <div className="text-hot-pink font-black text-2xl group-hover:scale-110 transition-transform duration-300">
            {followingCount}
          </div>
          <div className="text-hot-pink/60 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1">
            <UserCheck className="w-3 h-3" /> Following
          </div>
        </button>

        {/* XP Power */}
        <div className="bg-amber-50/50 rounded-2xl p-4 text-center border-2 border-amber-100 hover:border-amber-200 transition-colors group cursor-default">
          <div className="text-amber-500 font-black text-2xl group-hover:scale-110 transition-transform duration-300">
            {xpPoints}
          </div>
          <div className="text-amber-900/60 text-xs font-bold uppercase tracking-wide">
            XP Power
          </div>
        </div>
      </div>

      <FollowListModal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={modalType === "FOLLOWERS" ? "Followers" : "Following"}
        type={modalType || "FOLLOWERS"}
        targetId={targetId}
        targetType={targetType}
      />
    </>
  );
}
