import { Home, Plus, Trophy, User } from "lucide-react";

export default function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe">
      <div className="flex justify-around items-center h-16 px-4">
        <button className="flex flex-col items-center gap-1 text-brand-purple">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Badges</span>
        </button>
        
          {/* Elevated Create Button */}
          <div className="relative -top-6">
            <button className="w-14 h-14 bg-brand-purple rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-purple/40 ring-4 ring-white active:scale-95 transition-transform border-b-4 border-black/10">
              <Plus className="w-8 h-8 stroke-[3px]" />
            </button>
          </div>


        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Games</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Profile</span>
        </button>
      </div>
    </div>
  );
}
