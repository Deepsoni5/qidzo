"use client";
import { Search, Bell, ArrowLeft, LayoutDashboard, UserPlus } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ParentNavbar() {
  const router = useRouter();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/parent/dashboard" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center text-white font-nunito text-2xl font-black shadow-lg shadow-brand-purple/30 border-b-4 border-black/10">
                Q
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-nunito font-black text-brand-purple hidden sm:block tracking-tight leading-none">
                    Qidzo
                    </span>
                    <span className="text-xs font-bold text-gray-500 hidden sm:block">Parents</span>
                </div>
            </Link>

            <Link href="/" className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-purple transition-colors bg-gray-100 hover:bg-brand-purple/10 px-3 py-1.5 rounded-xl">
                <ArrowLeft className="w-4 h-4" /> Back to Website
            </Link>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4 sm:mx-8 hidden sm:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-brand-purple transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 transition-all duration-300 font-bold text-gray-700 shadow-sm group-hover:shadow-md"
                placeholder="Search children, posts..."
              />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
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
                </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
