"use client";

import { useState, useEffect } from "react";
import { Users, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { canCreateGroup } from "@/actions/groups";
import CreateGroupModal from "./CreateGroupModal";
import { useRouter } from "next/navigation";

interface CreateGroupButtonProps {
  currentUserId: string;
}

export default function CreateGroupButton({
  currentUserId,
}: CreateGroupButtonProps) {
  const router = useRouter();
  const [canCreate, setCanCreate] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setIsChecking(true);
    try {
      const result = await canCreateGroup();
      setCanCreate(result.canCreate);
      setCurrentPlan(result.currentPlan || "");
    } catch (error) {
      console.error("Error checking permission:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClick = () => {
    if (!canCreate) {
      toast.error("Groups are for PRO & ELITE members! 🌟", {
        description: "Upgrade to create groups and chat with multiple friends",
        action: {
          label: "Upgrade Now",
          onClick: () => router.push("/parent/upgrade"),
        },
      });
      return;
    }

    setIsModalOpen(true);
  };

  if (isChecking) {
    return null; // Don't show button while checking
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all active:scale-95 cursor-pointer ${
          canCreate
            ? "bg-brand-purple text-white hover:bg-brand-purple/90 shadow-lg shadow-brand-purple/20"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 relative"
        }`}
      >
        {canCreate ? (
          <>
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Create Group</span>
            <span className="sm:hidden">Group</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Create Group</span>
            <span className="sm:hidden">Group</span>
            <Sparkles className="w-3 h-3 text-hot-pink absolute -top-1 -right-1" />
          </>
        )}
      </button>

      {canCreate && (
        <CreateGroupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
