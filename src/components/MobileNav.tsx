"use client";
 
import { Home, Plus, Trophy, User, Users, LayoutDashboard, MonitorPlay, Gamepad2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import Link from "next/link";

import { checkIsParent } from "@/actions/parent";
import { getCurrentUserRole } from "@/actions/auth";
import { CreatePostModal } from "./CreatePostModal";

export default function MobileNav() {
  const router = useRouter();
  const { user } = useUser();
  const [userRole, setUserRole] = useState<{ role: string, isParent: boolean, isChild: boolean, child?: any } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const roleData = await getCurrentUserRole();
      setUserRole(roleData);
    };
    init();
  }, [user]);

  const handleCreatePost = async () => {
    const currentRole = await getCurrentUserRole();
    
    if (currentRole.role === "guest") {
        toast.error("Please log in to create a post!");
        return;
    }

    if (currentRole.isParent) {
        toast("Parents Mode! 🛡️", {
            description: "Parents can only view, react, and comment. Let the kids be the creators! 🎨",
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
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-2">
        {/* 1. Home */}
        <Link href="/" className="flex flex-col items-center justify-center gap-1 text-brand-purple w-full">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
        </Link>

        {/* 2. Tutorials */}
        <button 
          onClick={() => handleComingSoon("Tutorials")}
          className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-sky-blue transition-colors w-full"
        >
          <MonitorPlay className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Tutorials</span>
        </button>
        
        {/* 3. Create Button (Center) */}
        <div className="flex justify-center items-center w-full relative -top-6">
          <button 
              onClick={handleCreatePost}
              className="w-14 h-14 bg-brand-purple rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-purple/40 ring-4 ring-white active:scale-95 transition-transform border-b-4 border-black/10"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </button>
        </div>

        {/* 4. Play Zone */}
        <button 
          onClick={handlePlayZone}
          className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-hot-pink transition-colors w-full"
        >
          <Gamepad2 className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Play</span>
        </button>

        {/* 5. Friends */}
        <button 
          onClick={() => handleComingSoon("Friends")}
          className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-grass-green transition-colors w-full"
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Friends</span>
        </button>
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
