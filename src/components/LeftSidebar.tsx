"use client";

import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { checkIsParent } from "@/actions/parent";
import { getCurrentUserRole } from "@/actions/auth";
import { CreatePostModal } from "./CreatePostModal";

export default function LeftSidebar() {
  const router = useRouter();
  const { user } = useUser(); // Still useful for immediate client-side Clerk state
  const [userRole, setUserRole] = useState<{ role: string, isParent: boolean, isChild: boolean, child?: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const roleData = await getCurrentUserRole();
      setUserRole(roleData);
      setIsLoading(false);
    };
    init();
  }, [user]); // Re-run if Clerk user changes

  const handleCreatePost = async () => {
    // Refresh role check to be sure
    const currentRole = await getCurrentUserRole();
    
    if (currentRole.role === "guest") {
        toast.error("Please log in to create a post!");
        return;
    }

    if (currentRole.isParent) {
        toast("Parents Mode! 🛡️", {
            description: "Parents can only view and react. Let the kids be the creators! 🎨",
            duration: 4000,
            style: {
                background: '#FDF2F8', // pink-50
                border: '2px solid #EC4899', // hot-pink
                color: '#831843', // pink-900
                fontSize: '16px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 'bold'
            },
            className: "rounded-2xl shadow-xl"
        });
        return;
    }

    if (currentRole.isChild) {
        setIsCreateModalOpen(true);
        return;
    }
  };

  const handlePlayZone = async () => {
    const currentRole = await getCurrentUserRole();
    
    if (currentRole?.isChild && currentRole.child?.focus_mode) {
        toast("Exam Mode is Enabled! 🎓", {
            description: "Focus on your studies and earn rewards! Play Zone is temporarily locked. ✨",
            duration: 6000,
            style: {
                background: '#F0F9FF', // sky-50
                border: '3px solid #0EA5E9', // sky-blue
                color: '#075985', // sky-900
                fontSize: '16px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 'bold'
            },
            className: "rounded-2xl shadow-xl"
        });
        return;
    }

    router.push("/playzone");
   };

  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} is Coming Soon! 🚧`, {
        description: "We're building something awesome for you! Stay tuned.",
        style: {
            background: '#F0F9FF', // sky-50
            border: '2px solid #0EA5E9', // sky-blue
            color: '#075985', // sky-900
            fontSize: '16px',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 'bold'
        },
        className: "rounded-2xl shadow-xl"
    });
  };

  return (
    <>
    <div className="hidden xl:block w-68 shrink-0">
      <div className="sticky top-24 p-2">
        
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[32px] border-[3px] border-white ring-4 ring-gray-50 shadow-2xl shadow-brand-purple/5 relative overflow-hidden">
            
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-hot-pink/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <h3 className="relative font-nunito font-black text-xl mb-4 text-gray-800 flex items-center gap-2 pl-2">
                Explore! <span className="hover:animate-spin cursor-default">🚀</span>
            </h3>

            <ul className="space-y-1.5 relative z-10">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-full flex items-center gap-3 p-2.5 rounded-2xl border-2 border-transparent">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <Skeleton className="h-5 w-24 rounded-lg" />
                    </div>
                ))
              ) : (
                [
                { label: "Home", icon: "🏠", color: "text-brand-purple", bg: "bg-brand-purple/10", active: true, href: "/" },
                { label: "Tutorials", icon: "📺", color: "text-sky-blue", bg: "bg-sky-blue/10", active: false, action: () => handleComingSoon("Tutorials") },
                { label: "Play Zone", icon: "🎮", color: "text-hot-pink", bg: "bg-hot-pink/10", active: false, action: handlePlayZone },
                { label: "Friends", icon: "👥", color: "text-grass-green", bg: "bg-grass-green/10", active: false, action: () => handleComingSoon("Friends") },
                ...(userRole?.isParent 
                  ? [{ label: "Parent Dashboard", icon: "👨‍👩‍👧‍👦", color: "text-orange-500", bg: "bg-orange-500/10", active: false, href: "/parent/dashboard" }]
                  : [])
              ].map((item, i) => {
                const Component = item.href ? Link : 'button';
                return (
                    <Component 
                        href={item.href as string} 
                        onClick={item.action}
                        key={i} 
                        className={`w-full group flex items-center gap-3 p-2.5 rounded-2xl font-nunito font-bold cursor-pointer transition-all duration-300 text-left border-2 border-transparent hover:border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-gray-200/40 ${item.active ? 'bg-white shadow-lg shadow-gray-200/40 border-gray-100 scale-105' : 'hover:scale-[1.02]'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${item.bg} ${item.color}`}>
                            {item.icon}
                        </div>
                        <span className={`text-base tracking-tight text-gray-600 group-hover:text-gray-900 ${item.active ? 'text-gray-900' : ''}`}>
                            {item.label}
                        </span>
                        
                        {/* Active Indicator Dot */}
                        {item.active && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-purple" />
                        )}
                    </Component>
                )
              }))}
            </ul>

            <div className="mt-5 relative z-10">
                <button 
                    onClick={handleCreatePost}
                    className="group relative w-full overflow-hidden bg-gradient-to-br from-brand-purple to-hot-pink text-white font-black text-base py-3.5 rounded-2xl shadow-xl shadow-brand-purple/30 hover:shadow-2xl hover:shadow-hot-pink/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-b-4 border-black/10"
                >
                    <Sparkles className="w-6 h-6 text-sunshine-yellow fill-sunshine-yellow group-hover:rotate-6 transition-transform duration-300" />
                    <span className="relative">Create Magic</span>
                </button>
            </div>
        </div>
      </div>
    </div>
    
    {userRole?.isChild && userRole.child?.id && (
        <CreatePostModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
            childId={userRole.child.id}
        />
    )}
    </>
  );
}
