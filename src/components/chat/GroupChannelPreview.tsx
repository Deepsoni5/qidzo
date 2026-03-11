"use client";

import { Users } from "lucide-react";
import { useChatContext } from "stream-chat-react";

interface GroupChannelPreviewProps {
  channel: any;
  activeChannel: any;
  setActiveChannel: (channel: any) => void;
  currentUserId: string;
  onMobileClick?: () => void;
}

export default function GroupChannelPreview({
  channel,
  activeChannel,
  setActiveChannel,
  currentUserId,
  onMobileClick,
}: GroupChannelPreviewProps) {
  const { client } = useChatContext();
  const isActive = channel?.id === activeChannel?.id;
  const isGroup = channel?.type === "team";

  // Get channel data
  const channelName = channel?.data?.name || "Unnamed Group";
  const channelImage = channel?.data?.image;
  const memberCount = Object.keys(channel?.state?.members || {}).length;

  // Get last message
  const messages = channel?.state?.messages || [];
  const lastMessage = messages[messages.length - 1];
  const lastText = lastMessage?.text || "Start chatting";
  const lastAt = lastMessage?.created_at || channel?.state?.last_message_at;

  // Format time
  const formatTimeShort = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.max(0, Math.round(diffMs / 60000));
    if (diffMin < 1) return "Now";
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.round(diffH / 24);
    return `${diffD}d`;
  };

  const timeLabel = formatTimeShort(lastAt as any);

  // Get unread count
  let unreadCount = 0;
  try {
    unreadCount =
      typeof channel?.countUnread === "function" ? channel.countUnread() : 0;
  } catch {
    unreadCount = 0;
  }

  const handleClick = async () => {
    if (!channel) return;

    // Handle mobile click - same as 1-on-1 chat
    if (typeof window !== "undefined" && window.innerWidth < 640 && client) {
      const chan = client.channel(channel.type || "team", channel.id);
      await chan.watch();
      setActiveChannel(chan);
      if (onMobileClick) onMobileClick();
    } else {
      await channel.watch();
      setActiveChannel(channel);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full px-3 py-2.5 mb-1.5 rounded-2xl transition-all flex items-center gap-3 text-left hover:bg-slate-50 bg-transparent cursor-pointer"
    >
      <div className="relative">
        {/* Group Avatar */}
        <div className="w-11 h-11 rounded-full bg-brand-purple/10 overflow-hidden flex items-center justify-center text-xs font-extrabold text-brand-purple shadow-lg">
          {channelImage ? (
            <img
              src={channelImage}
              alt={channelName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-5 h-5" />
          )}
        </div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-hot-pink text-[10px] leading-[18px] text-white font-bold text-center px-1 shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Group indicator badge */}
        {isGroup && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-sm">
            <Users className="w-3 h-3 text-brand-purple" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {channelName}
            </p>
            {isGroup && (
              <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded-full shrink-0">
                {memberCount}
              </span>
            )}
          </div>
          {timeLabel && (
            <span className="text-[11px] font-semibold text-slate-400 ml-2 shrink-0">
              {timeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate font-bold">{lastText}</p>
      </div>
    </button>
  );
}
