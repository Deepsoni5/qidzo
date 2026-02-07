"use client";

import { Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import Link from "next/link";

import { checkIsParent } from "@/actions/parent";
import { getCurrentUserRole } from "@/actions/auth";
import { CreatePostModal } from "./CreatePostModal";

export default function LeftSidebar() {
  const { user } = useUser(); // Still useful for immediate client-side Clerk state
  const [userRole, setUserRole] = useState<{ role: string, isParent: boolean, isChild: boolean, child?: any } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const roleData = await getCurrentUserRole();
      setUserRole(roleData);
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
    <div className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-40 bg-white p-6 rounded-[32px] border-4 border-gray-100 shadow-xl shadow-gray-200/20">
        <h3 className="font-nunito font-black text-xl mb-6 text-gray-900">Explore! 🚀</h3>
        <ul className="space-y-4">
          {[
            { label: "Home", icon: "🏠", color: "text-brand-purple bg-brand-purple/10", active: true, href: "/" },
            { label: "Tutorials", icon: "📺", color: "text-sky-blue hover:bg-sky-blue/10", active: false, action: () => handleComingSoon("Tutorials") },
            { label: "Play Zone", icon: "🎮", color: "text-hot-pink hover:bg-hot-pink/10", active: false, action: () => handleComingSoon("Play Zone") },
            { label: "Friends", icon: "👥", color: "text-grass-green hover:bg-grass-green/10", active: false, action: () => handleComingSoon("Friends") },
            ...(userRole?.isParent 
              ? [{ label: "Parent Dashboard", icon: "👨‍👩‍👧‍👦", color: "text-orange-500 hover:bg-orange-500/10", active: false, href: "/parent/dashboard" }]
              : [])
          ].map((item, i) => {
            const Component = item.href ? Link : 'button';
            return (
                <Component 
                    href={item.href as string} 
                    onClick={item.action}
                    key={i} 
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl font-nunito font-black cursor-pointer transition-all duration-300 text-left ${item.color} ${item.active ? 'scale-105 shadow-sm' : 'hover:scale-105'}`}
                >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm tracking-tight">{item.label}</span>
                </Component>
            )
          })}
        </ul>

        <button 
            onClick={handleCreatePost}
            className="w-full mt-8 bg-gradient-to-r from-brand-purple to-hot-pink text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[3px]" />
          <span>Create Post</span>
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
