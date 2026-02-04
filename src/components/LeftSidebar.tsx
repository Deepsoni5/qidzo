"use client";

import { Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import Link from "next/link";

import { checkIsParent } from "@/actions/parent";

export default function LeftSidebar() {
  const { user } = useUser();
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    if (user) {
      const init = async () => {
        const isParentUser = await checkIsParent();
        if (isParentUser) setIsParent(true);
      };
      init();
    }
  }, [user]);

  const handleCreatePost = async () => {
    if (!user) {
        toast.error("Please log in to create a post!");
        return;
    }

    // Check if user is a parent (using cached action)
    const isParentUser = await checkIsParent();

    if (isParentUser) {
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

    // Logic for kids (navigation or modal open would go here)
    toast.info("Coming soon! 🚀", {
        description: "Post creation for kids is under construction!"
    });
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
    <div className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-40 bg-white p-6 rounded-[32px] border-4 border-gray-100 shadow-xl shadow-gray-200/20">
        <h3 className="font-nunito font-black text-xl mb-6 text-gray-900">Explore! 🚀</h3>
        <ul className="space-y-4">
          {[
            { label: "Home", icon: "🏠", color: "text-brand-purple bg-brand-purple/10", active: true, href: "/" },
            { label: "Tutorials", icon: "📺", color: "text-sky-blue hover:bg-sky-blue/10", active: false, action: () => handleComingSoon("Tutorials") },
            { label: "Play Zone", icon: "🎮", color: "text-hot-pink hover:bg-hot-pink/10", active: false, action: () => handleComingSoon("Play Zone") },
            { label: "Friends", icon: "👥", color: "text-grass-green hover:bg-grass-green/10", active: false, action: () => handleComingSoon("Friends") },
            ...(isParent 
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

        {/* Create Post Button */}
        <button 
            onClick={handleCreatePost}
            className="w-full mt-6 flex items-center justify-center gap-3 bg-brand-purple hover:bg-brand-purple/90 text-white p-4 rounded-2xl font-nunito font-black text-lg shadow-xl shadow-brand-purple/20 transition-all hover:scale-[1.02] active:scale-95 border-b-4 border-purple-800/20 active:border-b-0 active:translate-y-1 group"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
            <Plus className="w-6 h-6 stroke-[3px]" />
          </div>
          <span>Create Post</span>
        </button>

        <div className="mt-8 p-4 bg-sunshine-yellow/10 rounded-[24px] border-2 border-sunshine-yellow/20">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 text-center">Pro Tip! 💡</p>
          <p className="text-[11px] font-bold text-amber-900 text-center leading-relaxed">
            Completing challenges earns you 2x XP this week!
          </p>
        </div>
      </div>
    </div>
  );
}
