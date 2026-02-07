import { getChildSession } from "@/actions/auth";
import { getChildProfile } from "@/actions/profile";
import { Trophy, Flame, Star, Zap, Crown, Target, Palette, FlaskConical, Wand2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function Sidebar() {
  const session = await getChildSession();
  const profile = session ? await getChildProfile(session.username as string) : null;

  // Fallback/Demo data if no profile (or for the leaderboard)
  const currentLevel = profile?.level || 1;
  const currentXP = profile?.xp_points || 0;
  const nextLevelXP = currentLevel * 1000; // Simple progression logic
  const progress = Math.min((currentXP / nextLevelXP) * 100, 100);
  const streak = 7; // We don't have this in DB yet, keeping the "7" the user liked
  const totalPosts = profile?.total_posts || 0;
  
  return (
    <div className="hidden lg:flex flex-col gap-6 sticky top-28 h-[calc(100vh-120px)] overflow-y-auto beautiful-scrollbar pb-10 pr-2">
      
      {/* 1. Weekly Reward (Restored & Improved) */}
      <div className="bg-gradient-to-br from-sunshine-yellow to-orange-400 rounded-[32px] p-1 shadow-xl shadow-orange-200/50 transform transition-transform hover:scale-[1.02] cursor-pointer group">
        <div className="bg-white/90 backdrop-blur-sm rounded-[28px] p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Trophy className="w-24 h-24 text-sunshine-yellow" />
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-gradient-to-br from-sunshine-yellow to-orange-500 p-3 rounded-2xl shadow-lg text-white animate-bounce-slow">
                    <Trophy className="w-8 h-8 fill-white" />
                </div>
                <div>
                    <h3 className="font-nunito font-black text-gray-800 text-lg leading-none mb-1">Weekly Reward</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Claim your prize!</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. Your Magic Stats (Restored & Enhanced) */}
      <div className="bg-white rounded-[32px] border-4 border-brand-purple/10 shadow-xl shadow-brand-purple/5 p-6 relative">
        {/* Decorative background blobs - reduced size and blur to prevent overflow/cutoff issues if any */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-purple/5 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-hot-pink/5 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
                <h3 className="font-nunito font-black text-2xl text-gray-900 leading-tight">Your Magic ✨</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
                    {profile ? `@${profile.username}` : "Welcome Wizard!"}
                </p>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-100 to-red-50 text-orange-600 px-3 py-1.5 rounded-2xl border border-orange-100 shadow-sm shrink-0">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-600 animate-pulse" />
                <span className="font-black text-lg">{streak}</span>
            </div>
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
                        className="h-full bg-gradient-to-r from-brand-purple to-hot-pink rounded-full shadow-sm relative transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')] opacity-30"></div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Magic Created Added */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-2xl p-3 flex flex-col items-center justify-center border-2 border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer group">
                    <div className="bg-white p-2 rounded-xl shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        <Wand2 className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className="font-black text-indigo-900 text-lg leading-none mb-1">{totalPosts}</span>
                    <span className="font-bold text-indigo-400 text-[10px] uppercase tracking-wide text-center">Magic Created</span>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-3 flex flex-col items-center justify-center border-2 border-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer group">
                    <div className="bg-white p-2 rounded-xl shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        <FlaskConical className="w-6 h-6 text-emerald-500" />
                    </div>
                    <span className="font-black text-emerald-900 text-lg leading-none mb-1">2</span>
                    <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wide text-center">Badges</span>
                </div>
            </div>
        </div>
      </div>

      {/* 3. Top Wizards Leaderboard (Restored & Enhanced) */}
      <div className="bg-white rounded-[32px] border-4 border-gray-100 shadow-xl shadow-gray-200/50 p-6">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-sunshine-yellow/20 rounded-2xl text-amber-600">
                <Crown className="w-6 h-6 fill-amber-500" />
            </div>
            <h3 className="font-nunito font-black text-xl text-gray-900">Top Wizards</h3>
        </div>

        <div className="space-y-4">
            {[
                { name: "Maya", xp: "2,450", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya", rank: 1, color: "bg-amber-50 border-amber-100" },
                { name: "Alex", xp: "2,100", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", rank: 2, color: "bg-gray-50 border-gray-100" },
                { name: "Sophie", xp: "1,950", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie", rank: 3, color: "bg-orange-50 border-orange-100" },
            ].map((user, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border-2 ${user.color} hover:scale-105 transition-transform cursor-pointer`}>
                    <div className="flex items-center gap-3">
                        <div className="font-black text-lg w-6 text-center opacity-50">#{user.rank}</div>
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden relative">
                            <Image 
                                src={user.avatar} 
                                alt={user.name} 
                                fill 
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <span className="font-black text-gray-800 font-nunito">{user.name}</span>
                    </div>
                    <span className="text-xs font-black bg-white px-2 py-1 rounded-lg shadow-sm text-gray-600">
                        {user.xp} XP
                    </span>
                </div>
            ))}
            
            <button className="w-full mt-2 py-3 text-center text-xs font-black text-gray-400 hover:text-brand-purple hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest">
                View Leaderboard
            </button>
        </div>
      </div>

    </div>
  );
}
