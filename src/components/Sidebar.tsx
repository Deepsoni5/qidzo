import { Flame, Trophy, TrendingUp } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="hidden lg:flex flex-col gap-6 sticky top-40 h-[calc(100vh-160px)] overflow-y-auto no-scrollbar">
      
      {/* Weekly Reward Box (simplified) */}
      <div className="rounded-[32px] bg-white border-4 border-sunshine-yellow shadow-xl shadow-sunshine-yellow/10 overflow-visible">
        <div className="bg-sunshine-yellow p-4 text-center rounded-t-[28px]">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600 fill-amber-600" />
            <span className="font-nunito font-black text-xs text-amber-900 uppercase tracking-widest">
              Weekly Reward
            </span>
          </div>
        </div>
      </div>

      {/* Your Progress */}
      <div className="p-6 rounded-[32px] bg-white border-4 border-gray-100 shadow-xl shadow-gray-200/20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h3 className="font-nunito font-black text-2xl text-gray-900">Your Magic ✨</h3>
            <span className="text-xs font-bold text-gray-400">Level 12 Wizard</span>
          </div>
          <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-4 py-2 rounded-2xl text-lg font-black shadow-sm">
            <Flame className="w-5 h-5 fill-orange-600" />
            <span>7</span>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <div className="flex justify-between text-sm font-black mb-3">
              <span className="text-gray-400 uppercase tracking-widest text-[10px]">Experience points</span>
              <span className="text-brand-purple">850 / 1000</span>
            </div>
            <div className="h-5 bg-gray-100 rounded-full p-1 shadow-inner border border-gray-50">
              <div className="h-full bg-brand-purple w-[85%] rounded-full shadow-lg shadow-brand-purple/20 relative">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sky-blue p-4 rounded-3xl flex flex-col items-center shadow-lg shadow-sky-blue/20 transform hover:scale-105 transition-transform cursor-pointer">
              <div className="bg-white/20 p-2 rounded-2xl mb-2">
                <span className="text-2xl">🎨</span>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Artist</span>
            </div>
            <div className="bg-grass-green p-4 rounded-3xl flex flex-col items-center shadow-lg shadow-grass-green/20 transform hover:scale-105 transition-transform cursor-pointer">
              <div className="bg-white/20 p-2 rounded-2xl mb-2">
                <span className="text-2xl">🧪</span>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Scientist</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Learners */}
      <div className="p-6 rounded-[32px] bg-white border-4 border-gray-100 shadow-xl shadow-gray-200/20 mb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-grass-green rounded-2xl shadow-lg shadow-grass-green/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-nunito font-black text-2xl text-gray-900 leading-tight">Top Wizards</h3>
        </div>
        
        <div className="space-y-4">
          {[
            { name: "Maya", xp: "2,450", avatar: "👧", crown: "🥇", color: "bg-sunshine-yellow/10" },
            { name: "Alex", xp: "2,100", avatar: "👦", crown: "🥈", color: "bg-gray-100" },
            { name: "Sophie", xp: "1,950", avatar: "👩", crown: "🥉", color: "bg-orange-50" },
          ].map((user, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-2xl ${user.color} border-2 border-transparent hover:border-white transition-all cursor-pointer group`}>
              <div className="flex items-center gap-3">
                <span className="text-xl filter drop-shadow-md">{user.crown}</span>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm border-2 border-transparent group-hover:border-grass-green transition-all">
                  {user.avatar}
                </div>
                <span className="font-black text-gray-800 font-nunito">{user.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-grass-green bg-white px-2 py-1 rounded-lg shadow-sm">
                  {user.xp} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}