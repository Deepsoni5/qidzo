"use client";

import { Search, Bell, User, ArrowRight, LayoutDashboard, LogOut, Trophy, Flame, Wand2, Star, Badge, Users, UserCheck, Heart, MessageCircle, UserPlus } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserRole } from "@/actions/auth";
import { getChildSession, logoutChild } from "@/actions/auth";
import { getChildProfile, ChildProfile } from "@/actions/profile";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Image from "next/image";

export default function Navbar() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<{ role: string, isParent: boolean, isChild: boolean, child?: any } | null>(null);
  const [kid, setKid] = useState<any>(null);
  const [kidProfile, setKidProfile] = useState<ChildProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const roleData = await getCurrentUserRole();
      console.log("🔍 Navbar Role Data:", roleData); // DEBUG
      setUserRole(roleData);
    };
    init();
    
    // Check for kid session
    const checkKid = async () => {
        const session = await getChildSession();
        if (session) {
            setKid(session);
            // Fetch detailed profile
            const profile = await getChildProfile(session.username as string);
            setKidProfile(profile);
        }
    };
    checkKid();
  }, [user]);

  // Add this to see the state
  console.log("👤 User:", user?.id);
  console.log("🎭 UserRole State:", userRole);
  console.log("👨‍👩‍👧 Is Parent?:", userRole?.isParent);

  // Derived stats
  const currentLevel = kidProfile?.level || 1;
  const currentXP = kidProfile?.xp_points || 0;
  const nextLevelXP = currentLevel * 1000;
  const progress = Math.min((currentXP / nextLevelXP) * 100, 100);
  const streak = 7; // Mock streak for now
  const magics = kidProfile?.total_posts || 0;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center text-white font-nunito text-2xl font-black shadow-lg shadow-brand-purple/30 border-b-4 border-black/10">
                Q
              </div>
              <span className="text-2xl font-nunito font-black text-brand-purple hidden sm:block tracking-tight">
                Qidzo
              </span>
            </Link>


          {/* Search */}
          <div className="flex-1 max-w-md mx-4 sm:mx-8 hidden sm:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-2.5 border-2 border-brand-purple bg-gray-50 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 transition-all duration-300 font-bold text-gray-700 shadow-sm group-hover:shadow-md"
                placeholder="Search for magic... ✨"
              />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <SignedIn>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative hover:scale-110 active:scale-95 duration-200">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-hot-pink border-2 border-white rounded-full animate-pulse"></span>
                </button>
                <UserButton 
                    appearance={{
                        elements: {
                            avatarBox: "w-10 h-10 border-2 border-white shadow-md hover:scale-105 transition-transform duration-200",
                            userButtonPopoverFooter: "!hidden"
                        }
                    }}
                >
                  <UserButton.MenuItems>
                    {userRole?.isParent && (
                      <>
                        <UserButton.Action
                          label="Parent Dashboard"
                          labelIcon={<LayoutDashboard className="h-4 w-4" />}
                          onClick={() => router.push("/parent/dashboard")}
                        />
                        <UserButton.Action
                          label="Add Child"
                          labelIcon={<UserPlus className="h-4 w-4" />}
                          onClick={() => router.push("/parent/add-child")}
                        />
                      </>
                    )}
                  </UserButton.MenuItems>
                </UserButton>
            </SignedIn>
            <SignedOut>
                {kid ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-3 pl-2 border-l-2 border-gray-100 ml-2 group outline-none cursor-pointer">
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="font-black text-sm text-gray-700 leading-none mb-1 group-hover:text-brand-purple transition-colors">{kid.username}</span>
                                    <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-full group-hover:bg-sky-100 transition-colors">Kid Account</span>
                                </div>
                                <div className="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white shadow-md ring-2 ring-sky-100 group-hover:ring-brand-purple/20 transition-all overflow-hidden relative">
                                    {kidProfile?.avatar ? (
                                        <Image 
                                            src={kidProfile.avatar} 
                                            alt={kid.username} 
                                            fill 
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        kid.username[0].toUpperCase()
                                    )}
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 rounded-3xl border-4 border-gray-100 shadow-xl overflow-hidden mr-4" align="end">
                            {/* Header */}
                            <div className="bg-gradient-to-br from-sky-400 to-brand-purple p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-sky-500 font-black text-3xl border-4 border-white/20 shadow-lg overflow-hidden relative">
                                        {kidProfile?.avatar ? (
                                            <Image 
                                                src={kidProfile.avatar} 
                                                alt={kid.username} 
                                                fill 
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            kid.username[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xl leading-none mb-1">{kidProfile?.name || kid.username}</h4>
                                        <p className="text-sky-100 font-bold text-sm">@{kid.username}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="p-5 space-y-5 bg-white">
                                {/* Level Progress */}
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

                                {/* Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Followers */}
                                    <div className="bg-brand-purple/5 rounded-2xl p-3 border border-brand-purple/10 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform cursor-default">
                                        <Users className="w-6 h-6 text-brand-purple" />
                                        <span className="font-black text-xl text-gray-800">{kidProfile?.followers_count || 0}</span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Followers</span>
                                    </div>

                                    {/* Following */}
                                    <div className="bg-hot-pink/5 rounded-2xl p-3 border border-hot-pink/10 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform cursor-default">
                                        <UserCheck className="w-6 h-6 text-hot-pink" />
                                        <span className="font-black text-xl text-gray-800">{kidProfile?.following_count || 0}</span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Following</span>
                                    </div>

                                    {/* Total Likes */}
                                    <div className="bg-pink-50 rounded-2xl p-3 border border-pink-100 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform cursor-default">
                                        <Heart className="w-6 h-6 text-hot-pink fill-hot-pink/20" />
                                        <span className="font-black text-xl text-gray-800">{kidProfile?.total_likes_received || 0}</span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Likes Get</span>
                                    </div>

                                    {/* Total Comments */}
                                    <div className="bg-sky-50 rounded-2xl p-3 border border-sky-100 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform cursor-default">
                                        <MessageCircle className="w-6 h-6 text-sky-blue fill-sky-blue/20" />
                                        <span className="font-black text-xl text-gray-800">{kidProfile?.total_comments_made || 0}</span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Comments</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-2 bg-gray-50 border-t border-gray-100">
                                <button 
                                    onClick={async () => {
                                        await logoutChild();
                                        window.location.reload();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 p-3 text-red-500 font-black hover:bg-red-50 rounded-2xl transition-colors text-sm cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Log Out
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <Link href="/login">
                        <Button className="rounded-full cursor-pointer bg-gradient-to-r from-brand-purple to-purple-600 hover:from-brand-purple/90 hover:to-purple-600/90 text-white font-black px-6 pt-5 pb-4 shadow-lg shadow-brand-purple/25 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all duration-300 border-b-4 border-purple-800/20 active:border-b-0 active:translate-y-0.5 flex items-center justify-center gap-2">
                            Login <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                )}
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}