import { getChildSession } from "@/actions/auth";
import { getChildProfile } from "@/actions/profile";
import { Trophy, Crown } from "lucide-react";
import Image from "next/image";
import { UserStatsCard } from "./UserStatsCard";

export default async function Sidebar() {
  const session = await getChildSession();
  const profile = session ? await getChildProfile(session.username as string) : null;
  
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

      {/* 2. Your Magic Stats (Client Component) */}
      <UserStatsCard initialProfile={profile} />

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
