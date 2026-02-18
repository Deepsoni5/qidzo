"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { StreamChat } from "stream-chat";
import { ChevronLeft, MoreVertical, MessageCircle } from "lucide-react";
import {
  Chat,
  Channel,
  ChannelList,
  MessageList,
  MessageInput,
  Window,
  LoadingIndicator,
  useChatContext,
  useChannelStateContext,
  InfiniteScroll,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { toast } from "sonner";

let chatClient: StreamChat | null = null;

interface StreamUser {
  id: string;
  name?: string;
  image?: string;
  username?: string;
  age?: number;
  country?: string;
  level?: number;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [user, setUser] = useState<StreamUser | null>(null);
  const [initialChannelId, setInitialChannelId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileList, setShowMobileList] = useState(false);
  const userSelectedChannelRef = useRef(false);

  const targetUsername = searchParams.get("user");
  const initialChannelFromQuery = searchParams.get("channel");

  useEffect(() => {
    let cancelled = false;

    async function initChat() {
      try {
        setInitializing(true);
        setError(null);

        const res = await fetch("/api/chat/token", {
          method: "POST",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(
            data.error ||
              "Chat is only available for logged in children profiles"
          );
          setInitializing(false);
          return;
        }

        const data: {
          token: string;
          apiKey: string;
          user: StreamUser;
        } = await res.json();

        if (cancelled) return;

        if (!chatClient) {
          chatClient = StreamChat.getInstance(data.apiKey);
        }

        if (!chatClient.userID) {
          await chatClient.connectUser(
            {
              id: data.user.id,
              name: data.user.name,
              image: data.user.image,
            },
            data.token
          );
        }

        setClient(chatClient);
        setUser(data.user);

        if (initialChannelFromQuery) {
          const channel = chatClient.channel("messaging", initialChannelFromQuery);
          await channel.watch();
          if (!cancelled) {
            setInitialChannelId(initialChannelFromQuery);
          }
        } else if (targetUsername) {
          const dmRes = await fetch("/api/chat/start-dm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUsername }),
          });

          if (dmRes.ok) {
            const dmData: { channelId: string } = await dmRes.json();
            const channel = chatClient.channel("messaging", dmData.channelId);
            await channel.watch();
            if (!cancelled) {
              setInitialChannelId(dmData.channelId);
            }
          } else {
            const data = await dmRes.json().catch(() => ({} as any));
            if (dmRes.status === 403 && (data as any)?.code === "CHAT_LIMIT_REACHED") {
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
              // eslint-disable-next-line no-console
              console.error("Failed to start DM", data);
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError("Something went wrong while connecting to chat");
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    }

    initChat();

    return () => {
      cancelled = true;
    };
  }, [targetUsername, initialChannelFromQuery]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <LoadingIndicator size={32} />
          <p className="text-sm font-bold text-gray-500">
            Connecting to your messages...
          </p>
        </div>
      </div>
    );
  }

  if (error || !client || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl px-6 py-5 max-w-sm w-full text-center">
          <p className="text-sm font-black text-gray-900 mb-1">
            Messages are for kids only
          </p>
          <p className="text-xs font-bold text-gray-500">
            {error ||
              "Please log in with your kid profile to start chatting with friends."}
          </p>
        </div>
      </div>
    );
  }

  const filters = {
    type: "messaging",
    members: { $in: [user.id] },
  };

  const sort = { last_message_at: -1 as const };

  function InitialChannelSetter({ channelId }: { channelId: string | null }) {
    const { setActiveChannel, client } = useChatContext();
    useEffect(() => {
      let mounted = true;
      async function setChan() {
        if (!channelId || !client) return;

        if (userSelectedChannelRef.current) {
          return;
        }

        const chan = client.channel("messaging", channelId);
        await chan.watch();

        if (!mounted) return;

        setActiveChannel(chan);
      }
      setChan();
      return () => {
        mounted = false;
      };
    }, [channelId, client, setActiveChannel]);
    return null;
  }

  function ConversationHeader() {
    const { channel } = useChannelStateContext();
    const members = Object.values(channel?.state.members || {});
    const otherMember =
      members.find((m: any) => m.user && m.user.id !== user?.id) || members[0];
    const otherUser = otherMember?.user as any;
    const otherId = otherUser?.id as string | undefined;

    const usernamesMap =
      ((channel?.data as any)?.usernames as Record<string, string> | undefined) ||
      undefined;

    const usernameFromChannel =
      otherId && usernamesMap ? usernamesMap[otherId] : undefined;

    const [profileUsername, setProfileUsername] = useState<string | null>(
      usernameFromChannel ?? null
    );

    useEffect(() => {
      let cancelled = false;

      if (usernameFromChannel) {
        setProfileUsername(usernameFromChannel);
        return;
      }

      if (!otherId) return;

      async function loadUsername() {
        try {
          const res = await fetch("/api/chat/child-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childId: otherId }),
          });
          if (!res.ok) return;
          const data: { username?: string } = await res.json();
          if (!cancelled && data.username) {
            setProfileUsername(data.username);
          }
        } catch {
          // ignore
        }
      }

      loadUsername();

      return () => {
        cancelled = true;
      };
    }, [otherId, usernameFromChannel]);

    const title =
      (otherUser?.name as string) ||
      (profileUsername as string | null) ||
      "Conversation";

    const avatarUrl = (otherUser?.image as string | undefined) || undefined;
    const initials =
      typeof title === "string"
        ? title
            .split(" ")
            .map(part => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "Q";

    return (
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button
            className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 active:scale-95"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {profileUsername ? (
            <Link
              href={`/child/${encodeURIComponent(profileUsername)}`}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-extrabold text-gray-700">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-tight group-hover:underline">
                  {title}
                </p>
                <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.18em]">
                  Safe kids chat
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-extrabold text-gray-700">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-tight">
                  {title}
                </p>
                <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.18em]">
                  Safe kids chat
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="sm:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-bold uppercase tracking-[0.14em] active:scale-95"
            onClick={() => setShowMobileList(true)}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chats
          </button>
          <button className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 active:scale-95">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  function formatTimeShort(date: Date | string | undefined) {
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
  }

  function ChannelPreview(props: any) {
    const { channel, activeChannel } = props;
    const { client, setActiveChannel } = useChatContext();
    const isActive = channel?.id === activeChannel?.id;
    const members = Object.values(channel?.state?.members || {}) as any[];
    const otherMember =
      members.find((m: any) => m.user && m.user.id !== user?.id) || members[0];
    const otherUser = otherMember?.user;

    const title =
      (otherUser?.name as string) ||
      (otherUser?.id as string) ||
      channel?.data?.name ||
      "Friend";

    const messages = channel?.state?.messages || [];
    const lastMessage = messages[messages.length - 1];
    const lastText = lastMessage?.text || "Start a new chat";
    const lastAt = lastMessage?.created_at || channel?.state?.last_message_at;
    const timeLabel = formatTimeShort(lastAt as any);

    let unreadCount = 0;
    try {
      unreadCount = typeof channel?.countUnread === "function" ? channel.countUnread() : 0;
    } catch {
      unreadCount = 0;
    }

    const avatarUrl = (otherUser?.image as string | undefined) || undefined;
    const initials =
      typeof title === "string"
        ? title
            .split(" ")
            .map((part: string) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "Q";

    const handleClick = async () => {
      if (!channel) return;

      if (typeof window !== "undefined" && window.innerWidth < 640 && client) {
        userSelectedChannelRef.current = true;
        const chan = client.channel(channel.type || "messaging", channel.id);
        await chan.watch();
        setActiveChannel(chan);
        setShowMobileList(false);
      } else {
        userSelectedChannelRef.current = true;
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
          <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden cursor-pointer flex items-center justify-center text-xs font-extrabold text-gray-700">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-brand-purple text-[10px] leading-[18px] text-white font-bold text-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {title}
            </p>
            {timeLabel && (
              <span className="text-[11px] font-semibold text-slate-400 ml-2">
                {timeLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">
            {lastText}
          </p>
        </div>
      </button>
    );
  }

  function TypingIndicatorBar() {
    const channelState = useChannelStateContext() as any;
    const typing = channelState.typing as any;
    const typingUsers = (Object.values(typing || {}) as any[]).filter((t: any) => {
      return t.user && t.user.id !== user?.id;
    });

    if (!typingUsers.length) return null;

    const otherUser = typingUsers[0].user;
    const name =
      (otherUser.name as string) ||
      (otherUser.id as string) ||
      "Someone";

    return (
      <div className="px-5 pt-1 pb-1.5 flex items-center gap-2 text-[11px] text-gray-400">
        <span className="flex items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse [animation-delay:80ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse [animation-delay:160ms]" />
        </span>
        <span className="font-medium truncate max-w-[140px]">
          {name}
        </span>
        <span className="truncate">is typing...</span>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-b from-gray-50 via-sky-50/60 to-gray-50 pt-16 pb-8 sm:pt-20 sm:pb-24 lg:pb-0 overflow-hidden">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
        <Chat client={client} theme="str-chat__theme-light qidzo-chat-theme">
          <InitialChannelSetter channelId={initialChannelId} />
          {showMobileList && (
            <div className="fixed inset-0 z-40 sm:hidden bg-black/40">
              <div className="absolute inset-x-0 bottom-0 top-16 bg-white shadow-2xl flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-hot-pink uppercase tracking-[0.18em] mb-0.5">
                      Messages
                    </p>
                    <p className="text-xs font-bold text-gray-500">
                      Pick a chat to open
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 active:scale-95"
                    onClick={() => setShowMobileList(false)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChannelList
                    filters={filters}
                    sort={sort}
                    options={{}}
                    showChannelSearch
                    Preview={ChannelPreview}
                    Paginator={(props) => (
                      <InfiniteScroll {...props} threshold={150} />
                    )}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="h-full mt-2 mb-3 sm:mt-0 sm:mb-0 rounded-[32px] bg-gradient-to-br from-white via-indigo-50/70 to-white shadow-[0_22px_70px_rgba(15,23,42,0.20)] border border-white/80 overflow-hidden flex backdrop-blur-xl">
            <div className="w-0 sm:w-64 md:w-72 border-r border-gray-100 hidden sm:flex flex-col bg-gradient-to-b from-white via-sky-50/40 to-white">
              <div className="px-4 py-4 border-b border-gray-100">
                <p className="text-[11px] font-black text-hot-pink uppercase tracking-[0.18em] mb-0.5">
                  Messages
                </p>
                <p className="text-xs font-bold text-gray-500">
                  Chat with your Qidzo friends
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChannelList
                  filters={filters}
                  sort={sort}
                  options={{}}
                  showChannelSearch
                  Preview={ChannelPreview}
                  Paginator={(props) => (
                    <InfiniteScroll {...props} threshold={150} />
                  )}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#F5F5FB]">
              <Channel>
                <Window>
                  <ConversationHeader />
                  <div className="flex-1 min-h-0">
                    <MessageList />
                  </div>
                  <div className="border-t border-gray-100 bg-white/90">
                    <TypingIndicatorBar />
                    <MessageInput />
                  </div>
                </Window>
              </Channel>
            </div>
          </div>
        </Chat>
      </div>
    </div>
  );
}
