"use client";

import {
  Home,
  Plus,
  Trophy,
  User,
  Users,
  LayoutDashboard,
  MonitorPlay,
  Gamepad2,
  Sparkles,
  MessageCircle,
  Bot,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import Link from "next/link";

import { checkIsParent } from "@/actions/parent";
import { getCurrentUserRole } from "@/actions/auth";
import { CreatePostModal } from "./CreatePostModal";
import SchoolCreatePostModal from "./school/SchoolCreatePostModal";

export default function MobileNav() {
  const router = useRouter();
  const { user } = useUser();
  const [userRole, setUserRole] = useState<{
    role: string;
    isParent: boolean;
    isSchool?: boolean;
    isChild: boolean;
    child?: any;
  } | null>(null);
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
        description:
          "Parents can only view and react. Let the kids be the creators! 🎨",
        duration: 4000,
        style: {
          background: "#FDF2F8", // pink-50
          border: "2px solid #EC4899", // hot-pink
          color: "#831843", // pink-900
          fontSize: "16px",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "bold",
        },
        className: "rounded-2xl shadow-xl",
      });
      return;
    }

    if (currentRole.isChild || currentRole.isSchool) {
      setIsCreateModalOpen(true);
      return;
    }
  };

  const handlePlayZone = async () => {
    const currentRole = await getCurrentUserRole();

    if (currentRole?.isChild && currentRole.child?.focus_mode) {
      toast("Exam Mode is Enabled! 🎓", {
        description:
          "Focus on your studies and earn rewards! Play Zone is temporarily locked. ✨",
        duration: 6000,
        style: {
          background: "#F0F9FF", // sky-50
          border: "3px solid #0EA5E9", // sky-blue
          color: "#075985", // sky-900
          fontSize: "16px",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "bold",
        },
        className: "rounded-2xl shadow-xl",
      });
      return;
    }

    router.push("/playzone");
  };

  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} is Coming Soon! 🚧`, {
      description: "We're building something awesome for you! Stay tuned.",
      style: {
        background: "#F0F9FF",
        border: "2px solid #0EA5E9",
        color: "#075985",
        fontSize: "16px",
        fontFamily: "Nunito, sans-serif",
        fontWeight: "bold",
      },
      className: "rounded-2xl shadow-xl",
    });
  };

  const handleGenieAI = async () => {
    const currentRole = await getCurrentUserRole();

    if (!currentRole.isChild && !currentRole.isParent) {
      toast("Login Required! ✨", {
        description: "Please log in as a kid to talk to your AI Tutor! 🧞‍♂️",
        duration: 5000,
        style: {
          background: "#F5F3FF", // purple-50
          border: "3px solid #8B5CF6", // brand-purple
          color: "#5B21B6", // purple-900
          fontSize: "16px",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "bold",
        },
        className: "rounded-2xl shadow-xl",
      });
      return;
    }

    // Subscription check
    const { checkParentSubscription } = await import("@/actions/parent");
    let plan = "FREE";

    if (currentRole.isParent) {
      plan = (await checkParentSubscription()) || "FREE";
    } else if (currentRole.isChild) {
      const { supabase } = await import("@/lib/supabaseClient");
      const { data: child } = await supabase
        .from("children")
        .select("parent_id")
        .eq("child_id", (currentRole.child as any)?.id)
        .single();
      if (child) {
        plan = (await checkParentSubscription(child.parent_id)) || "FREE";
      }
    }

    if (plan !== "PRO" && plan !== "ELITE") {
      toast("Premium Access Required! 💎", {
        description: "Please upgrade to PRO or ELITE to use AI Tutor! ✨",
        duration: 5000,
        style: {
          background: "#FFF7ED", // orange-50
          border: "3px solid #F97316", // orange-500
          color: "#9A3412", // orange-900
          fontSize: "16px",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "bold",
        },
        className: "rounded-2xl shadow-xl",
      });
      return;
    }

    router.push("/genie");
  };

  const handleStudyHub = async () => {
    const currentRole = await getCurrentUserRole();

    if (!currentRole.isChild) {
      toast("Kid Account Required! 🎓", {
        description:
          "Please log in with a children account to view the Study Hub. ✨",
        duration: 5000,
        style: {
          background: "#F0F9FF", // sky-50
          border: "3px solid #0EA5E9", // sky-blue
          color: "#075985", // sky-900
          fontSize: "16px",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "bold",
        },
        className: "rounded-2xl shadow-xl",
      });
      return;
    }

    router.push("/study");
  };

  const handleMessages = async () => {
    const currentRole = await getCurrentUserRole();

    if (currentRole.role === "guest") {
      toast.error("Please log in to chat!", {
        description: "Messages are available only for kid profiles.",
      });
      return;
    }

    if (currentRole.isParent) {
      toast.error("Parents cannot chat with children.", {
        description: "Switch to a kid account to use messages.",
      });
      return;
    }

    router.push("/messages");
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe">
        <div className="grid grid-cols-6 items-center h-16 px-2">
          {/* 1. Home */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1 text-brand-purple w-full"
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Home
            </span>
          </Link>

          {/* 2. Study Hub */}
          <button
            onClick={handleStudyHub}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-sky-blue transition-colors w-full"
          >
            <MonitorPlay className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Study
            </span>
          </button>

          {/* 3. AI Tutor */}
          <button
            onClick={handleGenieAI}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand-purple transition-colors w-full"
          >
            <Bot className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              AI Tutor
            </span>
          </button>

          {/* 4. Create Post - Center Button */}
          <div className="flex justify-center items-center w-full relative -top-6">
            <button
              onClick={handleCreatePost}
              className="w-14 h-14 bg-brand-purple rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-purple/40 ring-4 ring-white active:scale-95 transition-transform border-b-4 border-black/10"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </button>
          </div>

          {/* 5. Play Zone */}
          <button
            onClick={handlePlayZone}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-hot-pink transition-colors w-full"
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Play
            </span>
          </button>

          {/* 6. Messages */}
          <button
            onClick={handleMessages}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-grass-green transition-colors w-full"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Chat
            </span>
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

      {userRole?.isSchool && (
        <SchoolCreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}
    </>
  );
}
