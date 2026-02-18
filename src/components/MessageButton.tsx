"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface MessageButtonProps {
  childId: string;
  username: string;
  className?: string;
  initialMessage?: string;
  label?: string;
  variant?: "primary" | "ghost";
}

export function MessageButton({
  childId,
  username,
  className,
  initialMessage,
  label,
  variant = "primary",
}: MessageButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const payload: any = { targetChildId: childId };
      if (initialMessage && initialMessage.trim()) {
        payload.initialMessage = initialMessage.trim();
      }

      const res = await fetch("/api/chat/start-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data?.code === "CHAT_LIMIT_REACHED") {
          toast.info("Chat Limit Reached", {
            description:
              "You can only chat with 5 kids on your current plan. Upgrade to Pro or Elite for unlimited chats.",
            style: {
              background: "#FDF2F8",
              border: "2px solid #EC4899",
              color: "#831843",
              fontSize: "16px",
              fontFamily: "Nunito, sans-serif",
              fontWeight: "bold",
            },
            action: {
              label: "Upgrade",
              onClick: () => window.location.assign("/parent/upgrade"),
            },
          });
        } else {
          toast.error("Could not start chat", {
            description: data.error || "Please try again in a moment.",
          });
        }
        setLoading(false);
        return;
      }

      const data: { channelId: string } = await res.json();
      router.push(`/messages?channel=${encodeURIComponent(data.channelId)}`);
    } catch (e) {
      toast.error("Could not start chat", {
        description: "Network issue. Please check your connection.",
      });
      setLoading(false);
    }
  };

  const baseClasses =
    "px-4 py-2.5 rounded-full font-black transition-all cursor-pointer hover:scale-105 active:scale-95 text-sm disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClasses =
    variant === "ghost"
      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
      : "bg-brand-purple text-white hover:bg-brand-purple/90";

  const displayLabel =
    loading && initialMessage
      ? "Sending..."
      : loading
      ? "Opening..."
      : label || "💬 Message";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${baseClasses} ${variantClasses} ${className || ""}`}
    >
      {displayLabel}
    </button>
  );
}
