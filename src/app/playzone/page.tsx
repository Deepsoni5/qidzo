"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Sparkles, Trophy, Star, Rocket, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCurrentUserRole } from "@/actions/auth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

export default function PlayzonePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const roleData = await getCurrentUserRole();
      
      // Strict Focus Mode check - redirect if enabled
      if (roleData?.isChild && roleData.child?.focus_mode) {
        toast("Exam Mode is Enabled! 🎓", {
          description: "Focus on your studies and earn rewards! Play Zone is temporarily locked. ✨",
          duration: 6000,
          style: {
            background: '#F0F9FF', // sky-50
            border: '3px solid #0EA5E9', // sky-blue
            color: '#075985', // sky-900
            fontSize: '18px',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 'bold'
          },
          className: "rounded-[24px] shadow-2xl border-b-8 border-black/5"
        });
        router.push("/");
        return;
      }

      setUserRole(roleData);
      setIsLoading(false);
    };
    init();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF4FF] font-nunito pb-24 lg:pb-0">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header Section */}
        <div className="relative bg-white rounded-[40px] p-8 md:p-12 shadow-xl shadow-brand-purple/5 border-4 border-white mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-hot-pink/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-24 h-24 bg-hot-pink rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-hot-pink/30 rotate-3 ring-8 ring-hot-pink/10">
              <Gamepad2 className="w-12 h-12 stroke-[2.5px]" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
                Play Zone! <span className="inline-block animate-bounce">🎮</span>
              </h1>
              <p className="text-xl text-gray-500 font-bold max-w-2xl">
                The ultimate destination for fun, challenges, and rewards! Show off your skills and level up.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <div className="bg-sunshine-yellow/20 px-6 py-3 rounded-2xl flex items-center gap-2 border-2 border-sunshine-yellow/20">
                <Star className="w-6 h-6 text-sunshine-yellow fill-sunshine-yellow" />
                <span className="text-xl font-black text-amber-700">120 XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Focus Mode Warning */}
        {userRole?.isChild && userRole.child?.focus_mode && (
          <div className="bg-sky-50 border-4 border-sky-100 p-6 rounded-[32px] mb-8 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-3xl">🎓</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-black text-sky-900 mb-1">Focus Mode Active!</h2>
              <p className="text-sky-700 font-bold">
                You're in study mode! Some games are locked so you can focus on your learning goals. 
                Finish your tasks to unlock everything! 🚀
              </p>
            </div>
          </div>
        )}

        {/* Games Grid Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Space Explorer", icon: "🚀", color: "bg-purple-100", textColor: "text-purple-600", locked: userRole?.child?.focus_mode },
            { title: "Math Magic", icon: "🔢", color: "bg-blue-100", textColor: "text-blue-600", locked: false },
            { title: "Word Wizard", icon: "📝", color: "bg-green-100", textColor: "text-green-600", locked: false },
            { title: "Dino Dash", icon: "🦖", color: "bg-orange-100", textColor: "text-orange-600", locked: userRole?.child?.focus_mode },
            { title: "Art Attack", icon: "🎨", color: "bg-pink-100", textColor: "text-pink-600", locked: false },
            { title: "Puzzle Master", icon: "🧩", color: "bg-indigo-100", textColor: "text-indigo-600", locked: userRole?.child?.focus_mode },
          ].map((game, i) => (
            <div 
              key={i}
              className={`group relative bg-white p-4 rounded-[36px] border-4 border-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${game.locked ? 'opacity-75' : ''}`}
            >
              <div className={`${game.color} rounded-[28px] p-8 mb-6 flex items-center justify-center relative overflow-hidden`}>
                <span className="text-6xl group-hover:scale-110 transition-transform duration-300 z-10">{game.icon}</span>
                {game.locked && (
                  <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <div className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl scale-110">
                      <span className="text-xl">🔒</span>
                      <span className="font-black text-gray-900 text-sm">LOCKED</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-4 pb-4">
                <h3 className="text-2xl font-black text-gray-900 mb-2">{game.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-sunshine-yellow" />
                    <span className="text-sm font-bold text-gray-400">50 XP</span>
                  </div>
                  <button 
                    disabled={game.locked}
                    className={`px-6 py-2 rounded-xl font-black text-sm transition-all active:scale-95 ${
                      game.locked 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20 hover:bg-brand-purple/90 cursor-pointer'
                    }`}
                  >
                    {game.locked ? 'Study First!' : 'Play Now!'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
