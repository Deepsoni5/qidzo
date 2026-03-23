"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MessageSquare,
  Send,
  X,
  Users,
  PhoneOff,
  Loader2,
  Radio,
  Volume2,
  VolumeX,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { getLiveClassById } from "@/actions/live-classes";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe?: boolean;
}

export default function StudentViewerPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [liveClass, setLiveClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [allPeers, setAllPeers] = useState<
    {
      uid: number | string;
      name: string;
      hasVideo: boolean;
      isMuted: boolean;
      avatar: string | null;
    }[]
  >([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uidNameMap, setUidNameMap] = useState<
    Record<number, { name: string; avatar: string | null }>
  >({});
  const [myName, setMyName] = useState("You");
  const [myAvatar, setMyAvatar] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const myUidRef = useRef<number | null>(null);
  const localVideoContainerRef = useRef<HTMLDivElement>(null);
  const isPublishingRef = useRef(false);
  const msgCounterRef = useRef(0);
  // Track the teacher's UID once identified — prevents duplicate teacher tiles
  const teacherUidRef = useRef<number | string | null>(null);
  // Keep a ref to remote users so the play-effect can access current tracks
  const remoteUsersRef = useRef<IAgoraRTCRemoteUser[]>([]);
  // Screen share UID → maps to teacher's tile (Agora uses a separate UID for screen share)
  const screenShareUidRef = useRef<number | string | null>(null);
  // Mirror of allPeers as a ref so event handlers always see current UIDs
  const allPeersRef = useRef<{ uid: number | string }[]>([]);

  useEffect(() => {
    getLiveClassById(classId).then((data) => {
      setLiveClass(data);
      setLoading(false);
    });
  }, [classId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep allPeersRef in sync so Agora event handlers always see current peer UIDs
  useEffect(() => {
    allPeersRef.current = allPeers;
  }, [allPeers]);

  // Poll class status every 5s — redirect when host ends the class
  useEffect(() => {
    if (!joined) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/live/status/${classId}`);
        const { status } = await res.json();
        if (status === "ended") {
          clearInterval(poll);
          await cleanupAndLeave();
          // Update local state so the "class ended" screen renders immediately
          setJoined(false);
          setLiveClass((prev: any) =>
            prev ? { ...prev, status: "ended" } : prev,
          );
          toast.info("The teacher ended the class 📚");
        }
      } catch {
        // silent
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [joined, classId]);

  // Poll kick list every 4s — leave if host removed this student
  useEffect(() => {
    if (!joined || myUidRef.current == null) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/live/kick?classId=${classId}&uid=${myUidRef.current}`,
        );
        const { kicked } = await res.json();
        if (kicked) {
          clearInterval(poll);
          await cleanupAndLeave();
          setJoined(false);
          setLiveClass((prev: any) =>
            prev ? { ...prev, status: "ended" } : prev,
          );
          toast.warning("You were removed from the class by the teacher 👋");
        }
      } catch {
        // silent
      }
    }, 4000);
    return () => clearInterval(poll);
  }, [joined, classId]);

  // Poll uid→name map every 5s to resolve real names
  useEffect(() => {
    if (!joined) return;
    const fetchNames = () =>
      fetch(`/api/live/uid-names/${classId}`)
        .then((r) => r.json())
        .then(
          ({
            map,
          }: {
            map: Record<number, { name: string; avatar: string | null }>;
          }) => {
            if (!map) return;
            setUidNameMap(map);
            setAllPeers((prev) => {
              const updated = prev.map((p) => {
                const info = map[p.uid as number];
                const isTeacher = !info;
                if (isTeacher && teacherUidRef.current === null) {
                  teacherUidRef.current = p.uid;
                }
                return {
                  ...p,
                  name: info?.name ?? "👨‍🏫 Teacher",
                  avatar: info?.avatar ?? null,
                };
              });
              // Deduplicate: keep only the first "👨‍🏫 Teacher" entry
              let teacherSeen = false;
              return updated.filter((p) => {
                if (p.name === "👨‍🏫 Teacher") {
                  if (teacherSeen) return false;
                  teacherSeen = true;
                }
                return true;
              });
            });
          },
        )
        .catch(() => {});
    fetchNames();
    const t = setInterval(fetchNames, 5000);
    return () => clearInterval(t);
  }, [joined, classId]);

  const addSystemMessage = (text: string) => {
    msgCounterRef.current += 1;
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${msgCounterRef.current}-${Date.now()}`,
        sender: "System",
        text,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const cleanupAndLeave = async () => {
    if (localAudioRef.current) {
      await clientRef.current?.unpublish(localAudioRef.current).catch(() => {});
      localAudioRef.current.close();
      localAudioRef.current = null;
    }
    if (localVideoRef.current) {
      await clientRef.current?.unpublish(localVideoRef.current).catch(() => {});
      localVideoRef.current.close();
      localVideoRef.current = null;
    }
    await clientRef.current?.leave().catch(() => {});
    // Notify server so host polling removes this student immediately
    fetch("/api/live/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    }).catch(() => {});
  };

  const joinChannel = useCallback(async () => {
    if (!liveClass || joining) return;
    setJoining(true);
    try {
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;
      await client.setClientRole("audience", { level: 1 });

      const uid = Math.floor(Math.random() * 100000) + 1;

      const res = await fetch("/api/agora/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: liveClass.channel_name,
          uid,
          role: "audience",
        }),
      });
      const { token, appId } = await res.json();
      await client.join(appId, liveClass.channel_name, token, uid);
      // Use the actual UID Agora assigned (may differ from requested)
      const actualUid = (client.uid as number) ?? uid;
      myUidRef.current = actualUid;

      client.on("user-published", async (user, mediaType) => {
        // Don't process self loopback
        if (user.uid === myUidRef.current) return;
        await client.subscribe(user, mediaType);

        if (mediaType === "video") {
          // If this UID is unknown AND we already have a teacher, it's the
          // teacher's screen share (Agora publishes screen share from a new UID)
          const isScreenShare =
            teacherUidRef.current !== null &&
            user.uid !== teacherUidRef.current &&
            !allPeersRef.current.find((p) => p.uid === user.uid);

          if (isScreenShare) {
            // Map this screen share UID → teacher's tile
            screenShareUidRef.current = user.uid;
            // Mark teacher's tile as hasVideo so avatar overlay hides
            setAllPeers((prev) =>
              prev.map((p) =>
                p.uid === teacherUidRef.current ? { ...p, hasVideo: true } : p,
              ),
            );
            // Play into teacher's DOM element
            setTimeout(() => {
              const el = document.getElementById(
                `viewer-remote-${teacherUidRef.current}`,
              );
              if (el) user.videoTrack?.play(el);
            }, 50);
            return;
          }

          setRemoteUsers((prev) => {
            const next = prev.find((u) => u.uid === user.uid)
              ? prev.map((u) => (u.uid === user.uid ? user : u))
              : [...prev, user];
            remoteUsersRef.current = next;
            return next;
          });
          setAllPeers((prev) => {
            const exists = prev.find((p) => p.uid === user.uid);
            if (exists) {
              return prev.map((p) =>
                p.uid === user.uid ? { ...p, hasVideo: true } : p,
              );
            }
            return [
              ...prev,
              {
                uid: user.uid,
                name: `Student ${user.uid}`,
                hasVideo: true,
                isMuted: true,
                avatar: null,
              },
            ];
          });
          // Don't play here — the useEffect below handles it after React re-renders
        }

        if (mediaType === "audio") {
          user.audioTrack?.play();
          setAllPeers((prev) =>
            prev.map((p) =>
              p.uid === user.uid ? { ...p, isMuted: false } : p,
            ),
          );
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          // If this is the screen share UID, revert teacher's tile to avatar
          if (user.uid === screenShareUidRef.current) {
            screenShareUidRef.current = null;
            setAllPeers((prev) =>
              prev.map((p) =>
                p.uid === teacherUidRef.current ? { ...p, hasVideo: false } : p,
              ),
            );
            return;
          }
          setRemoteUsers((prev) => {
            const next = prev.filter((u) => u.uid !== user.uid);
            remoteUsersRef.current = next;
            return next;
          });
          setAllPeers((prev) =>
            prev.map((p) =>
              p.uid === user.uid ? { ...p, hasVideo: false } : p,
            ),
          );
        }
        if (mediaType === "audio") {
          setAllPeers((prev) =>
            prev.map((p) => (p.uid === user.uid ? { ...p, isMuted: true } : p)),
          );
        }
      });

      client.on("user-joined", (user) => {
        // Don't add self as a remote peer
        if (user.uid === myUidRef.current) return;
        // Skip if this is the teacher we already seeded from initialPeers
        if (user.uid === teacherUidRef.current) return;
        setAllPeers((prev) => {
          if (prev.find((p) => p.uid === user.uid)) return prev;
          return [
            ...prev,
            {
              uid: user.uid,
              name: `Student ${user.uid}`,
              hasVideo: false,
              isMuted: true,
              avatar: null,
            },
          ];
        });
        setParticipantCount((prev) => prev + 1);
      });

      client.on("user-left", (user) => {
        setRemoteUsers((prev) => {
          const next = prev.filter((u) => u.uid !== user.uid);
          remoteUsersRef.current = next;
          return next;
        });
        setAllPeers((prev) => prev.filter((p) => p.uid !== user.uid));
        setParticipantCount((prev) => Math.max(0, prev - 1));
      });

      // Seed allPeers with anyone already in channel (e.g. host), excluding self
      // The first remote user is almost certainly the teacher — track their UID
      const initialPeers = client.remoteUsers
        .filter((u) => u.uid !== actualUid)
        .map((u) => ({
          uid: u.uid,
          name: `Student ${u.uid}`,
          hasVideo: !!u.videoTrack,
          isMuted: !u.audioTrack,
          avatar: null,
        }));
      // If there's exactly one person already in channel, they're the teacher
      if (initialPeers.length === 1) {
        teacherUidRef.current = initialPeers[0].uid;
      }
      setAllPeers(initialPeers);
      setJoined(true);
      setParticipantCount(client.remoteUsers.length + 1);
      addSystemMessage("You joined the class 🎉");

      // Fetch own name + avatar
      fetch("/api/live/me")
        .then((r) => r.json())
        .then(({ name, avatar }) => {
          if (name) setMyName(name);
          if (avatar) setMyAvatar(avatar);
        })
        .catch(() => {});

      // Record attendance with actual agora uid for name mapping (fire and forget)
      fetch("/api/live/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, uid: actualUid }),
      }).catch(() => {});
    } catch (err: any) {
      toast.error("Failed to join: " + (err.message || "Unknown error"));
    } finally {
      setJoining(false);
    }
  }, [liveClass, joining]);

  useEffect(() => {
    return () => {
      localAudioRef.current?.close();
      localVideoRef.current?.close();
      clientRef.current?.leave();
    };
  }, []);

  // After every remoteUsers change, re-play all video tracks into their DOM elements.
  // This handles screen share start/stop, reconnects, and any case where the
  // DOM element wasn't ready when user-published fired.
  useEffect(() => {
    if (remoteUsers.length === 0) return;
    // Small delay to let React commit the DOM
    const t = setTimeout(() => {
      remoteUsers.forEach((user) => {
        if (!user.videoTrack) return;
        const el = document.getElementById(`viewer-remote-${user.uid}`);
        if (el) user.videoTrack.play(el);
      });
    }, 50);
    return () => clearTimeout(t);
  }, [remoteUsers]);

  // Ensure we're in host role before publishing
  const ensureHostRole = async () => {
    if (!isPublishingRef.current) {
      await clientRef.current?.setClientRole("host");
      isPublishingRef.current = true;
    }
  };

  // Drop back to audience only if neither mic nor cam is active
  const maybeDropToAudience = async (afterMic: boolean, afterCam: boolean) => {
    if (!afterMic && !afterCam) {
      await clientRef.current?.setClientRole("audience");
      isPublishingRef.current = false;
    }
  };

  const toggleMic = async () => {
    if (!clientRef.current) return;
    try {
      if (!micOn) {
        await ensureHostRole();
        if (!localAudioRef.current) {
          const audio = await AgoraRTC.createMicrophoneAudioTrack();
          localAudioRef.current = audio;
          await clientRef.current.publish(audio);
        } else {
          await localAudioRef.current.setEnabled(true);
          await clientRef.current.publish(localAudioRef.current);
        }
        setMicOn(true);
      } else {
        if (localAudioRef.current) {
          await clientRef.current.unpublish(localAudioRef.current);
          await localAudioRef.current.setEnabled(false);
        }
        setMicOn(false);
        await maybeDropToAudience(false, camOn);
      }
    } catch (err: any) {
      toast.error("Mic error: " + err.message);
    }
  };

  const toggleCam = async () => {
    if (!clientRef.current) return;
    try {
      if (!camOn) {
        await ensureHostRole();
        if (!localVideoRef.current) {
          let video: ICameraVideoTrack;
          try {
            video = await AgoraRTC.createCameraVideoTrack();
          } catch {
            toast.error("Camera not available 📷");
            await maybeDropToAudience(micOn, false);
            return;
          }
          localVideoRef.current = video;
          await clientRef.current.publish(video);
        } else {
          await localVideoRef.current.setEnabled(true);
          await clientRef.current.publish(localVideoRef.current);
        }
        // Play local preview
        if (localVideoContainerRef.current) {
          localVideoRef.current!.play(localVideoContainerRef.current);
        }
        setCamOn(true);
      } else {
        if (localVideoRef.current) {
          await clientRef.current.unpublish(localVideoRef.current);
          await localVideoRef.current.setEnabled(false);
        }
        setCamOn(false);
        await maybeDropToAudience(micOn, false);
      }
    } catch (err: any) {
      toast.error("Camera error: " + err.message);
    }
  };

  const toggleSpeaker = () => {
    const newVal = !speakerOn;
    setSpeakerOn(newVal);
    // Use live client remote users (not stale state) and setVolume for reliability
    clientRef.current?.remoteUsers.forEach((user) => {
      user.audioTrack?.setVolume(newVal ? 100 : 0);
    });
  };

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    msgCounterRef.current += 1;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${msgCounterRef.current}-${Date.now()}`,
        sender: "You",
        text: chatMsg,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: true,
      },
    ]);
    setChatMsg("");
  };

  const handleLeave = async () => {
    await cleanupAndLeave();
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white font-black">Class not found</p>
      </div>
    );
  }

  if (liveClass.status === "ended") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-black text-white font-nunito mb-2">
            Class has ended
          </h2>
          <p className="text-gray-400 font-bold mb-6">{liveClass.title}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-brand-purple text-white rounded-2xl font-black cursor-pointer hover:scale-105 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (liveClass.status === "scheduled") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-[32px] p-8 w-full max-w-md text-center border border-gray-800">
          <div className="text-5xl mb-4">⏰</div>
          <h2 className="text-2xl font-black text-white font-nunito mb-2">
            Class hasn't started yet
          </h2>
          <p className="text-brand-purple font-bold text-sm mb-1">
            {liveClass.title}
          </p>
          {liveClass.school?.name && (
            <p className="text-gray-400 font-bold text-sm mb-4">
              {liveClass.school.name}
            </p>
          )}
          {liveClass.scheduled_at && (
            <p className="text-sunshine-yellow font-bold text-sm mb-6">
              Scheduled for{" "}
              {new Date(liveClass.scheduled_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          <p className="text-gray-500 text-xs font-bold mb-6">
            Check back when your teacher starts the class.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 text-gray-400 font-bold text-sm cursor-pointer hover:text-gray-200 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-[32px] p-8 w-full max-w-md text-center border border-gray-800">
          {liveClass.school?.logo_url && (
            <img
              src={liveClass.school.logo_url}
              alt="School"
              className="w-16 h-16 rounded-2xl mx-auto mb-4 object-contain bg-white p-1"
            />
          )}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-black uppercase tracking-widest">
              Live Now
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-nunito mb-1">
            {liveClass.title}
          </h2>
          {liveClass.subject && (
            <p className="text-brand-purple font-bold text-sm mb-1">
              {liveClass.subject}
            </p>
          )}
          {liveClass.school?.name && (
            <p className="text-gray-400 font-bold text-sm mb-6">
              {liveClass.school.name}
            </p>
          )}
          {liveClass.description && (
            <p className="text-gray-500 text-sm font-bold mb-6 bg-gray-800 rounded-2xl p-3">
              {liveClass.description}
            </p>
          )}
          <button
            onClick={joinChannel}
            disabled={joining}
            className="w-full py-4 bg-brand-purple text-white rounded-2xl font-black text-lg shadow-lg shadow-brand-purple/30 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Radio className="w-5 h-5" /> Join Class
              </>
            )}
          </button>
          <button
            onClick={() => router.back()}
            className="mt-3 w-full py-3 text-gray-500 font-bold text-sm cursor-pointer hover:text-gray-300 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-black uppercase tracking-widest">
                Live
              </span>
            </div>
            <div>
              <p className="text-white font-black text-sm font-nunito truncate max-w-[160px] md:max-w-none">
                {liveClass.title}
              </p>
              {liveClass.school?.name && (
                <p className="text-gray-400 text-xs font-bold">
                  {liveClass.school.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-xl text-gray-300 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            {participantCount}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Video area */}
          <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden min-h-0">
            {allPeers.length > 0 ? (
              <ViewerVideoGrid
                allPeers={allPeers}
                myUid={myUidRef.current}
                camOn={camOn}
                micOn={micOn}
                localVideoRef={localVideoContainerRef}
                myName={myName}
                myAvatar={myAvatar}
              />
            ) : (
              <div className="flex-1 bg-gray-900 rounded-[24px] flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="text-5xl mb-3">⏳</div>
                  <p className="text-gray-400 font-black font-nunito">
                    Waiting for others to join...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Side panel — Chat + People (same as host) */}
          {(showChat || showParticipants) && (
            <div className="absolute inset-0 sm:relative sm:inset-auto sm:w-80 bg-gray-900 sm:border-l sm:border-gray-800 flex flex-col z-30">
              {/* Header — always visible, bg ensures it's not transparent */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0 bg-gray-900">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowChat(true);
                      setShowParticipants(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${showChat ? "bg-brand-purple text-white" : "text-gray-400 hover:text-white"}`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => {
                      setShowParticipants(true);
                      setShowChat(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${showParticipants ? "bg-brand-purple text-white" : "text-gray-400 hover:text-white"}`}
                  >
                    People ({allPeers.length + 1})
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowChat(false);
                    setShowParticipants(false);
                  }}
                  className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 cursor-pointer shrink-0 border border-red-500/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {showChat && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <p className="text-gray-500 text-xs font-bold text-center py-8">
                        No messages yet 👋
                      </p>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        {msg.sender === "System" ? (
                          <p className="text-gray-500 text-[10px] font-bold text-center">
                            {msg.text}
                          </p>
                        ) : (
                          <div
                            className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[10px] font-bold text-gray-500 mb-1">
                              {msg.sender} · {msg.time}
                            </span>
                            <div
                              className={`px-3 py-2 rounded-2xl max-w-[85%] ${msg.isMe ? "bg-brand-purple text-white" : "bg-gray-800 text-gray-200"}`}
                            >
                              <p className="text-sm font-bold">{msg.text}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t border-gray-800 flex gap-2">
                    <input
                      type="text"
                      value={chatMsg}
                      onChange={(e) => setChatMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Message..."
                      className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-purple/50"
                    />
                    <button
                      onClick={sendMessage}
                      className="p-2 bg-brand-purple rounded-xl text-white cursor-pointer hover:bg-brand-purple/80 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {showParticipants && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {/* Self entry */}
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-2xl">
                    {myAvatar ? (
                      <img
                        src={myAvatar}
                        alt={myName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-sm font-black text-white shrink-0">
                        {myName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white text-xs font-black">{myName}</p>
                      <p className="text-[10px] font-bold text-sky-400">
                        Student
                      </p>
                    </div>
                  </div>
                  {allPeers.map((p) => {
                    const isTeacher = p.name === "👨‍🏫 Teacher";
                    return (
                      <div
                        key={String(p.uid)}
                        className="flex items-center gap-3 p-3 bg-gray-800 rounded-2xl"
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-sm">
                          {isTeacher ? "👨‍🏫" : "👦"}
                        </div>
                        <div>
                          <p className="text-white text-xs font-black">
                            {p.name}
                          </p>
                          <p
                            className={`text-[10px] font-bold ${isTeacher ? "text-sunshine-yellow" : p.isMuted ? "text-red-400" : "text-grass-green"}`}
                          >
                            {isTeacher
                              ? "Host"
                              : p.isMuted
                                ? "Muted"
                                : "Speaking"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-4">
          <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
            <button
              onClick={toggleMic}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all cursor-pointer ${micOn ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
            >
              {micOn ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
              <span className="text-[10px] font-black">
                {micOn ? "Mute" : "Unmute"}
              </span>
            </button>

            <button
              onClick={toggleCam}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all cursor-pointer ${camOn ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
            >
              {camOn ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
              <span className="text-[10px] font-black">
                {camOn ? "Stop Cam" : "Start Cam"}
              </span>
            </button>

            <button
              onClick={toggleSpeaker}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all cursor-pointer ${speakerOn ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
            >
              {speakerOn ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
              <span className="text-[10px] font-black">
                {speakerOn ? "Speaker" : "Muted"}
              </span>
            </button>

            <button
              onClick={() => {
                setHandRaised(!handRaised);
                if (!handRaised) addSystemMessage("You raised your hand ✋");
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all cursor-pointer ${handRaised ? "bg-sunshine-yellow/20 text-sunshine-yellow border border-sunshine-yellow/30" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
            >
              <Hand className="w-5 h-5" />
              <span className="text-[10px] font-black">
                {handRaised ? "Lower Hand" : "Raise Hand"}
              </span>
            </button>

            <button
              onClick={() => {
                setShowChat(!showChat);
                setShowParticipants(false);
                if (!showChat) setUnreadCount(0);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all cursor-pointer relative ${showChat ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] font-black">Chat</span>
              {unreadCount > 0 && !showChat && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-hot-pink rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
                setShowChat(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all cursor-pointer ${showParticipants ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-black">People</span>
            </button>

            <button
              onClick={handleLeave}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all cursor-pointer shadow-lg shadow-red-500/30"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-[10px] font-black">Leave</span>
            </button>
          </div>
        </div>
      </div>
      {/* end max-w-6xl wrapper */}
    </div>
  );
}

// ── ViewerVideoGrid ───────────────────────────────────────────────────────────
// Google Meet-style: self tile + one tile per remote peer, avatar when camera off
function ViewerVideoGrid({
  allPeers,
  myUid,
  camOn,
  micOn,
  localVideoRef,
  myName,
  myAvatar,
}: {
  allPeers: {
    uid: number | string;
    name: string;
    hasVideo: boolean;
    isMuted: boolean;
    avatar: string | null;
  }[];
  myUid: number | null;
  camOn: boolean;
  micOn: boolean;
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  myName: string;
  myAvatar: string | null;
}) {
  const total = 1 + allPeers.length; // self + remotes

  // Responsive cols: on mobile max 1 col for solo, 2 for multi
  // On desktop follow Google Meet layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const cols = isMobile
    ? total === 1
      ? 1
      : 2
    : total === 1
      ? 1
      : total === 2
        ? 2
        : total <= 4
          ? 2
          : total <= 9
            ? 3
            : total <= 16
              ? 4
              : 5;

  const rows = Math.ceil(total / cols);
  // On mobile give each row a fixed min height so tiles don't collapse
  const rowMinH = isMobile ? "120px" : "0px";
  // On mobile with 2 tiles, cap height so they don't stretch the full screen
  const maxH = isMobile && total === 2 ? "260px" : undefined;

  return (
    <div
      className="flex-1 w-full grid gap-2 min-h-0"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(${rowMinH}, 1fr))`,
        maxHeight: maxH,
      }}
    >
      {/* Self tile */}
      <div className="relative bg-gray-900 rounded-[20px] overflow-hidden min-h-0">
        <div ref={localVideoRef} className="w-full h-full" />
        {!camOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-2">
              {myAvatar ? (
                <img
                  src={myAvatar}
                  alt={myName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-brand-purple/40"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-purple/20 flex items-center justify-center text-2xl font-black text-white">
                  {myName.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="text-white text-xs font-black font-nunito">
                Camera Off
              </p>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <div className="px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-sky-400" />
            <span className="text-white text-[10px] font-black">{myName}</span>
          </div>
          {!micOn && (
            <div className="p-1 bg-red-500/80 rounded-md">
              <MicOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Remote peer tiles */}
      {allPeers.map((peer) => {
        const isTeacher = peer.name === "👨‍🏫 Teacher";
        return (
          <div
            key={String(peer.uid)}
            className="relative bg-gray-800 rounded-[20px] overflow-hidden min-h-0"
          >
            <div id={`viewer-remote-${peer.uid}`} className="w-full h-full" />
            {!peer.hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="flex flex-col items-center gap-2">
                  {peer.avatar ? (
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-brand-purple/40"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-brand-purple/20 flex items-center justify-center text-2xl font-black text-white">
                      {isTeacher ? "👨‍🏫" : peer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="text-white text-xs font-black font-nunito">
                    {peer.name}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <div className="px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg">
                <span className="text-white text-[10px] font-black">
                  {peer.name}
                </span>
              </div>
              {peer.isMuted && (
                <div className="p-1 bg-red-500/80 rounded-md">
                  <MicOff className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
