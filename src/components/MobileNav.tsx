"use client";

import { Home, Plus, Trophy, User, Users, LayoutDashboard } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MobileNav() {
  const { user } = useUser();
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    if (user) {
      const checkParent = async () => {
        const { data } = await supabase
          .from("parents")
          .select("id")
          .eq("clerk_id", user.id)
          .single();
        if (data) setIsParent(true);
      };
      checkParent();
    }
  }, [user]);

  const handleCreatePost = async () => {
    if (!user) {
        toast.error("Please log in to create a post!");
        return;
    }

    // Check if user is a parent
    const { data: parentData } = await supabase
        .from("parents")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

    if (parentData) {
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

    // Logic for kids
    toast.info("Coming soon! 🚀", {
        description: "Post creation for kids is under construction!"
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe">
      <div className="flex justify-around items-center h-16 px-4">
        <Link href="/" className="flex flex-col items-center gap-1 text-brand-purple">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
        </Link>
        <Link href="/badges" className="flex flex-col items-center gap-1 text-gray-400">
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Badges</span>
        </Link>
        
          {/* Elevated Create Button */}
          <div className="relative -top-6">
            <button 
                onClick={handleCreatePost}
                className="w-14 h-14 bg-brand-purple rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-purple/40 ring-4 ring-white active:scale-95 transition-transform border-b-4 border-black/10"
            >
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
