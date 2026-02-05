"use client";

import { Search, Bell, User, ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkIsParent } from "@/actions/parent";
import { getChildSession, logoutChild } from "@/actions/auth";

export default function Navbar() {
  const { user } = useUser();
  const [isParent, setIsParent] = useState(false);
  const [kid, setKid] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const init = async () => {
        const isParentUser = await checkIsParent();
        if (isParentUser) setIsParent(true);
      };
      init();
    }
    
    // Check for kid session
    const checkKid = async () => {
        const session = await getChildSession();
        if (session) setKid(session);
    };
    checkKid();
  }, [user]);

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
                    key={isParent ? "parent" : "children"}
                    appearance={{
                        elements: {
                            avatarBox: "w-10 h-10 border-2 border-white shadow-md hover:scale-105 transition-transform duration-200",
                            userButtonPopoverFooter: "!hidden"
                        }
                    }}
                >
                      <UserButton.MenuItems>
    {isParent && (
      <UserButton.Action
        label="Parent Dashboard"
        labelIcon={<LayoutDashboard className="h-4 w-4" />}
        onClick={() => router.push("/parent/dashboard")}
      />
    )}
  </UserButton.MenuItems>
                </UserButton>
            </SignedIn>
            <SignedOut>
                {kid ? (
                    <div className="flex items-center gap-3 pl-2 border-l-2 border-gray-100 ml-2">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="font-black text-sm text-gray-700 leading-none mb-1">{kid.username}</span>
                            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-full">Kid Account</span>
                        </div>
                        <div className="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white shadow-md ring-2 ring-sky-100">
                            {kid.username[0].toUpperCase()}
                        </div>
                        <button 
                            onClick={async () => {
                                await logoutChild();
                                window.location.reload();
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <Link href="/login">
                        <Button className="rounded-full bg-gradient-to-r from-brand-purple to-purple-600 hover:from-brand-purple/90 hover:to-purple-600/90 text-white font-black px-6 pt-5 pb-4 shadow-lg shadow-brand-purple/25 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all duration-300 border-b-4 border-purple-800/20 active:border-b-0 active:translate-y-0.5 flex items-center justify-center gap-2">
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
