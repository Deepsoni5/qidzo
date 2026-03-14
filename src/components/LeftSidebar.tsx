"use client";

import { useRouter } from "next/navigation";
import {
  Sparkles,
  Home,
  BookOpen,
  Gamepad2,
  MessageCircle,
  LayoutDashboard,
  School,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUserRole } from "@/actions/auth";
import { CreatePostModal } from "./CreatePostModal";
import SchoolCreatePostModal from "./school/SchoolCreatePostModal";
import { useUserRoleStore } from "@/store/userRoleStore";
import { useUser } from "@clerk/nextjs";

interface UserRoleData {
  role: string;
  isParent: boolean;
  isSchool?: boolean;
  isChild: boolean;
  child?: any;
}

interface LeftSidebarProps {
  initialUserRole?: UserRoleData | null;
}

export default function LeftSidebar({
  initialUserRole = null,
}: LeftSidebarProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { roleData, isLoading, setRoleData, setLoading, shouldRefresh } =
    useUserRoleStore();
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();

  useEffect(() => {
    if (!clerkLoaded) return;

    // Already have fresh data — skip
    if (roleData && !shouldRefresh()) return;

    // Seed from SSR prop if available
    if (initialUserRole && !roleData) {
      setRoleData({
        ...initialUserRole,
        isSchool: initialUserRole.isSchool ?? false,
      });
      return;
    }

    // Parent or school just logged out — set guest immediately, no fetch needed
    if (isSignedIn === false && (roleData?.isParent || roleData?.isSchool)) {
      setRoleData({
        role: "guest",
        isParent: false,
        isSchool: false,
        isChild: false,
      });
      return;
    }

    // Fetch from server — works for Clerk (parent/school), JWT (child), or unauthenticated
    const fetchRole = async () => {
      setLoading(true);
      try {
        const data = await getCurrentUserRole();
        setRoleData({ ...data, isSchool: data.isSchool ?? false });
      } catch {
        setRoleData({
          role: "guest",
          isParent: false,
          isSchool: false,
          isChild: false,
        });
      }
    };
    fetchRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, clerkLoaded]);

  const handlePrefetch = (path: string) => router.prefetch(path);

  const handleCreatePost = () => {
    if (!roleData || roleData.role === "guest") {
      toast.error("Please log in to create a post!");
      return;
    }
    if (roleData.isParent) {
      toast("Parents Mode! 🛡️", {
        description:
          "Parents can only view and react. Let the kids be the creators! 🎨",
        duration: 4000,
        style: {
          background: "#FDF2F8",
          border: "2px solid #EC4899",
          color: "#831843",
          fontSize: "16px",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "bold",
        },
        className: "rounded-2xl shadow-xl",
      });
      return;
    }
    if (roleData.isChild || roleData.isSchool) {
      setIsCreateModalOpen(true);
    }
  };

  const handlePlayZone = () => {
    if (roleData?.isChild && roleData.child?.focus_mode) {
      toast("Exam Mode is Enabled! 🎓", {
        description:
          "Focus on your studies and earn rewards! Play Zone is temporarily locked. ✨",
        duration: 6000,
        style: {
          background: "#F0F9FF",
          border: "3px solid #0EA5E9",
          color: "#075985",
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

  const handleStudyHub = () => {
    if (!roleData?.isChild) {
      toast("Kid Account Required! 🎓", {
        description:
          "Please log in with a children account to view the Study Hub. ✨",
        duration: 5000,
        style: {
          background: "#F0F9FF",
          border: "3px solid #0EA5E9",
          color: "#075985",
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

  const handleMessages = () => {
    if (roleData?.isParent) {
      toast.error("Parents cannot chat with children.", {
        description: "Switch to a kid account to use messages.",
      });
      return;
    }
    if (!roleData?.isChild && !roleData?.isSchool) {
      toast.error("Please log in to chat!", {
        description: "Messages are available only for kid profiles.",
      });
      return;
    }
    router.push("/messages");
  };

  const navItems = [
    {
      label: "Home",
      icon: Home,
      color: "text-brand-purple",
      bg: "bg-brand-purple/10",
      href: "/",
    },
    {
      label: "Study Hub",
      icon: BookOpen,
      color: "text-sky-blue",
      bg: "bg-sky-blue/10",
      action: handleStudyHub,
      prefetch: "/study",
    },
    {
      label: "Play Zone",
      icon: Gamepad2,
      color: "text-hot-pink",
      bg: "bg-hot-pink/10",
      action: handlePlayZone,
      prefetch: "/playzone",
    },
    {
      label: "Messages",
      icon: MessageCircle,
      color: "text-grass-green",
      bg: "bg-grass-green/10",
      action: handleMessages,
      prefetch: "/messages",
    },
    ...(roleData?.isParent
      ? [
          {
            label: "Parent Dashboard",
            icon: LayoutDashboard,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            href: "/parent/dashboard",
          },
        ]
      : []),
    ...(roleData?.isSchool
      ? [
          {
            label: "School Dashboard",
            icon: School,
            color: "text-sky-blue",
            bg: "bg-sky-blue/10",
            href: "/school/dashboard",
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="hidden xl:block w-68 shrink-0">
        <div className="sticky top-24 p-2">
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[32px] border-[3px] border-white ring-4 ring-gray-50 shadow-2xl shadow-brand-purple/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-hot-pink/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <h3 className="relative font-nunito font-black text-xl mb-4 text-gray-800 flex items-center gap-2 pl-2">
              Explore!{" "}
              <span className="hover:animate-spin cursor-default">🚀</span>
            </h3>

            <ul className="space-y-1.5 relative z-10">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-full flex items-center gap-3 p-2.5 rounded-2xl border-2 border-transparent"
                    >
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <Skeleton className="h-5 w-24 rounded-lg" />
                    </div>
                  ))
                : navItems.map((item, i) => {
                    const isHome = item.href === "/";
                    const Component = item.href ? Link : "button";
                    return (
                      <Component
                        key={i}
                        href={item.href as string}
                        onClick={(item as any).action}
                        onMouseEnter={() => {
                          const path = item.href || (item as any).prefetch;
                          if (path) handlePrefetch(path);
                        }}
                        className={`w-full group flex items-center gap-3 p-2.5 rounded-2xl font-nunito font-bold cursor-pointer transition-all duration-300 text-left border-2 border-transparent hover:border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-gray-200/40 ${
                          isHome
                            ? "bg-white shadow-lg shadow-gray-200/40 border-gray-100 scale-105"
                            : "hover:scale-[1.02]"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${item.bg} ${item.color}`}
                        >
                          <item.icon className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <span
                          className={`text-base tracking-tight text-gray-600 group-hover:text-gray-900 ${isHome ? "text-gray-900" : ""}`}
                        >
                          {item.label}
                        </span>
                        {isHome && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-purple" />
                        )}
                      </Component>
                    );
                  })}
            </ul>

            <div className="mt-5 relative z-10">
              <button
                onClick={handleCreatePost}
                className="group relative w-full overflow-hidden bg-linear-to-br from-brand-purple to-hot-pink text-white font-black text-base py-3.5 rounded-2xl shadow-xl shadow-brand-purple/30 hover:shadow-2xl hover:shadow-hot-pink/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-b-4 border-black/10"
              >
                <Sparkles className="w-6 h-6 text-sunshine-yellow fill-sunshine-yellow group-hover:rotate-6 transition-transform duration-300" />
                <span className="relative">Create Magic</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {roleData?.isChild && roleData.child?.id && (
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          childId={roleData.child.id}
        />
      )}

      {roleData?.isSchool && (
        <SchoolCreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      )}
    </>
  );
}
