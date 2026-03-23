"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  Users,
  MessageSquare,
  Send,
  X,
  Volume2,
  VolumeX,
  MoreVertical,
  Shield,
  UserMinus,
  Loader2,
  Copy,
  Check,
  Clock,
  GraduationCap,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLiveClassById,
  endLiveClass,
  getClassAttendees,
} from "@/actions/live-classes";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isHost?: boolean;
}
interface Participant {
  uid: number | string;
  name: string;
  isMuted: boolean;
  hasVideo: boolean;
  isHost?: boolean;
}

function useDuration(startedAt: string | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export default function HostRoomPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [liveClass, setLiveClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [classEnded, setClassEnded] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [uidNameMap, setUidNameMap] = useState<
    Record<number, { name: string; avatar: string | null }>
  >({});

  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [copied, setCopied] = useState(false);
  const [participantMenuOpen, setParticipantMenuOpen] = useState<string | null>(
    null,
  );

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const localVideoContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // UIDs already in channel when host joined — these are ghost/stale connections
  const ghostUidsRef = useRef<Set<number | string>>(new Set());
  // The host's own Agora-assigned UID (may differ from requested 0)
  const myUidRef = useRef<number | string | null>(null);
  // UIDs that have explicitly left — polling must never re-add these
  const leftUidsRef = useRef<Set<number | string>>(new Set());
  // Mirror of remoteUsers for the play-effect
  const remoteUsersRef = useRef<IAgoraRTCRemoteUser[]>([]);

  const duration = useDuration(liveClass?.started_at ?? null);

  useEffect(() => {
    getLiveClassById(classId).then((data) => {
      setLiveClass(data);
      setLoading(false);
    });
  }, [classId]);

  const msgCounterRef = useRef(0);

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

  const joinChannel = useCallback(async () => {
    if (!liveClass) return;
    try {
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;
      await client.setClientRole("host");

      const res = await fetch("/api/agora/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: liveClass.channel_name,
          uid: 0,
          role: "host",
        }),
      });
      const { token, appId } = await res.json();

      await client.join(appId, liveClass.channel_name, token, 0);
      // Store actual assigned UID — Agora replaces 0 with a server-generated UID
      myUidRef.current = client.uid ?? null;
      // Snapshot UIDs already in channel — stale ghost connections to ignore
      // Also add our own UID so any loopback events are filtered
      client.remoteUsers.forEach((u) => ghostUidsRef.current.add(u.uid));
      if (myUidRef.current != null) ghostUidsRef.current.add(myUidRef.current);

      client.on("user-published", async (user, mediaType) => {
        if (ghostUidsRef.current.has(user.uid)) return;
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            const next = prev.find((u) => u.uid === user.uid)
              ? prev.map((u) => (u.uid === user.uid ? user : u))
              : [...prev, user];
            remoteUsersRef.current = next;
            return next;
          });
          // Mark hasVideo true
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === user.uid ? { ...p, hasVideo: true } : p,
            ),
          );
          // Video play handled by remoteUsers useEffect after React re-renders
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
          // Mark unmuted
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === user.uid ? { ...p, isMuted: false } : p,
            ),
          );
        }
        // Add if not already present
        setParticipants((prev) =>
          prev.find((p) => p.uid === user.uid)
            ? prev
            : [
                ...prev,
                {
                  uid: user.uid,
                  name: `Student ${user.uid}`,
                  isMuted: mediaType !== "audio",
                  hasVideo: mediaType === "video",
                },
              ],
        );
        setTimeout(() => {
          fetch(`/api/live/uid-names/${classId}`)
            .then((r) => r.json())
            .then(({ map }) => {
              if (!map) return;
              setUidNameMap(map);
              setParticipants((prev) =>
                prev.map((p) =>
                  p.isHost
                    ? p
                    : { ...p, name: map[p.uid as number]?.name ?? p.name },
                ),
              );
            })
            .catch(() => {});
        }, 2000);
      });

      client.on("user-joined", (user) => {
        if (ghostUidsRef.current.has(user.uid)) return;
        setParticipants((prev) =>
          prev.find((p) => p.uid === user.uid)
            ? prev
            : [
                ...prev,
                {
                  uid: user.uid,
                  name: `Student ${user.uid}`,
                  isMuted: true,
                  hasVideo: false,
                },
              ],
        );
        setTimeout(() => {
          fetch(`/api/live/uid-names/${classId}`)
            .then((r) => r.json())
            .then(({ map }) => {
              if (!map) return;
              setUidNameMap(map);
              setParticipants((prev) =>
                prev.map((p) =>
                  p.isHost
                    ? p
                    : { ...p, name: map[p.uid as number]?.name ?? p.name },
                ),
              );
            })
            .catch(() => {});
        }, 2000);
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            const next = prev.filter((u) => u.uid !== user.uid);
            remoteUsersRef.current = next;
            return next;
          });
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === user.uid ? { ...p, hasVideo: false } : p,
            ),
          );
        }
        if (mediaType === "audio") {
          setParticipants((prev) =>
            prev.map((p) => (p.uid === user.uid ? { ...p, isMuted: true } : p)),
          );
        }
      });

      client.on("user-left", (user) => {
        leftUidsRef.current.add(user.uid);
        setRemoteUsers((prev) => {
          const next = prev.filter((u) => u.uid !== user.uid);
          remoteUsersRef.current = next;
          return next;
        });
        setParticipants((prev) => prev.filter((p) => p.uid !== user.uid));
      });

      let audioTrack: IMicrophoneAudioTrack | null = null;
      let videoTrack: ICameraVideoTrack | null = null;
      try {
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        audioTrack = tracks[0];
        videoTrack = tracks[1];
      } catch {
        toast.warning("Camera not available, starting with audio only 🎤");
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        } catch (e: any) {
          toast.error("Mic unavailable: " + e.message);
          await client.leave();
          return;
        }
      }

      // Start with mic and cam OFF — host enables manually
      if (audioTrack) await audioTrack.setEnabled(false);
      if (videoTrack) await videoTrack.setEnabled(false);

      localAudioRef.current = audioTrack;
      localVideoRef.current = videoTrack;
      setMicOn(false);
      setCamOn(false);

      setJoined(true);
      setParticipants([
        {
          uid: 0,
          name: "You (Host)",
          isMuted: true,
          hasVideo: false,
          isHost: true,
        },
      ]);
      addSystemMessage("You started the class 🎉");
    } catch (err: any) {
      toast.error("Failed to join: " + (err.message || "Unknown error"));
    }
  }, [liveClass]);

  useEffect(() => {
    if (liveClass && !joined) joinChannel();
  }, [liveClass, joined, joinChannel]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll uid→name map every 5s — updates names and removes participants who left.
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
            // UIDs currently publishing (hosts/co-hosts) — always keep these
            const publishingUids = new Set(
              (clientRef.current?.remoteUsers ?? []).map((u) => u.uid),
            );
            setParticipants((prev) => {
              let updated = prev
                .filter((p) => {
                  if (p.isHost) return true;
                  // Keep if still in DB map (audience member still present)
                  if (map[p.uid as number]) return true;
                  // Keep if actively publishing video/audio (host-role student)
                  if (publishingUids.has(p.uid)) return true;
                  // Not in DB and not publishing → they left, remove them
                  return false;
                })
                .map((p) =>
                  p.isHost
                    ? p
                    : { ...p, name: map[p.uid as number]?.name ?? p.name },
                );
              // Add audience members from DB who aren't in participants yet
              Object.entries(map).forEach(([uidStr, info]) => {
                const uid = Number(uidStr);
                if (ghostUidsRef.current.has(uid)) return;
                if (!updated.find((p) => p.uid === uid)) {
                  updated = [
                    ...updated,
                    { uid, name: info.name, isMuted: true, hasVideo: false },
                  ];
                }
              });
              // Deduplicate by name — keep latest entry per name (handles reconnects)
              const seen = new Set<string>();
              return updated
                .reverse()
                .filter((p) => {
                  if (p.isHost) return true;
                  if (seen.has(p.name)) return false;
                  seen.add(p.name);
                  return true;
                })
                .reverse();
            });
          },
        )
        .catch(() => {});
    fetchNames();
    const t = setInterval(fetchNames, 5000);
    return () => clearInterval(t);
  }, [joined, classId]);

  useEffect(
    () => () => {
      localAudioRef.current?.close();
      localVideoRef.current?.close();
      screenTrackRef.current?.close();
      clientRef.current?.leave();
    },
    [],
  );

  // After every remoteUsers change, re-play all video tracks into their DOM elements.
  // Handles camera on/off, screen share start/stop, reconnects.
  useEffect(() => {
    if (remoteUsers.length === 0) return;
    const t = setTimeout(() => {
      remoteUsers.forEach((user) => {
        if (!user.videoTrack) return;
        const el = document.getElementById(`remote-${user.uid}`);
        if (el) user.videoTrack.play(el);
      });
    }, 50);
    return () => clearTimeout(t);
  }, [remoteUsers]);

  const toggleMic = async () => {
    if (!localAudioRef.current || !clientRef.current) {
      toast.error("Microphone not available");
      return;
    }
    try {
      if (micOn) {
        await clientRef.current.unpublish(localAudioRef.current);
        await localAudioRef.current.setEnabled(false);
        setParticipants((prev) =>
          prev.map((p) => (p.isHost ? { ...p, isMuted: true } : p)),
        );
      } else {
        await localAudioRef.current.setEnabled(true);
        await clientRef.current.publish(localAudioRef.current);
        setParticipants((prev) =>
          prev.map((p) => (p.isHost ? { ...p, isMuted: false } : p)),
        );
      }
      setMicOn(!micOn);
    } catch (e: any) {
      toast.error("Mic toggle failed: " + e.message);
    }
  };

  const toggleCam = async () => {
    if (!localVideoRef.current || !clientRef.current) {
      toast.error("Camera not available");
      return;
    }
    try {
      if (camOn) {
        await clientRef.current.unpublish(localVideoRef.current);
        await localVideoRef.current.setEnabled(false);
        setParticipants((prev) =>
          prev.map((p) => (p.isHost ? { ...p, hasVideo: false } : p)),
        );
      } else {
        await localVideoRef.current.setEnabled(true);
        await clientRef.current.publish(localVideoRef.current);
        // Play in local preview container
        if (localVideoContainerRef.current) {
          localVideoRef.current.play(localVideoContainerRef.current);
        }
        setParticipants((prev) =>
          prev.map((p) => (p.isHost ? { ...p, hasVideo: true } : p)),
        );
      }
      setCamOn(!camOn);
    } catch (e: any) {
      toast.error("Camera toggle failed: " + e.message);
    }
  };

  const toggleScreenShare = async () => {
    if (!clientRef.current) return;
    if (screenSharing) {
      // Stop screen share
      if (screenTrackRef.current) {
        await clientRef.current.unpublish(screenTrackRef.current);
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      // Only re-publish camera if it was ON before screen share
      if (localVideoRef.current && camOn) {
        await localVideoRef.current.setEnabled(true);
        await clientRef.current.publish(localVideoRef.current);
        if (localVideoContainerRef.current)
          localVideoRef.current.play(localVideoContainerRef.current);
      } else if (localVideoContainerRef.current) {
        // Camera is off — clear the preview container
        localVideoContainerRef.current.innerHTML = "";
      }
      setScreenSharing(false);
      // Update host tile hasVideo to reflect actual cam state
      setParticipants((prev) =>
        prev.map((p) => (p.isHost ? { ...p, hasVideo: camOn } : p)),
      );
      addSystemMessage("Screen sharing stopped");
    } else {
      try {
        const screenTrack = (await AgoraRTC.createScreenVideoTrack(
          {},
          "disable",
        )) as ILocalVideoTrack;

        // Listen for browser's native "Stop sharing" button
        screenTrack.on("track-ended", async () => {
          if (!clientRef.current) return;
          await clientRef.current.unpublish(screenTrack).catch(() => {});
          screenTrack.close();
          screenTrackRef.current = null;
          // Re-publish camera if it was on
          if (localVideoRef.current && camOn) {
            await localVideoRef.current.setEnabled(true);
            await clientRef.current
              .publish(localVideoRef.current)
              .catch(() => {});
            if (localVideoContainerRef.current)
              localVideoRef.current.play(localVideoContainerRef.current);
          } else if (localVideoContainerRef.current) {
            localVideoContainerRef.current.innerHTML = "";
          }
          setScreenSharing(false);
          setParticipants((prev) =>
            prev.map((p) => (p.isHost ? { ...p, hasVideo: camOn } : p)),
          );
          addSystemMessage("Screen sharing stopped");
        });

        if (localVideoRef.current && camOn)
          await clientRef.current.unpublish(localVideoRef.current);
        await clientRef.current.publish(screenTrack);
        if (localVideoContainerRef.current)
          screenTrack.play(localVideoContainerRef.current);
        screenTrackRef.current = screenTrack;
        setScreenSharing(true);
        // Host tile shows video (screen share)
        setParticipants((prev) =>
          prev.map((p) => (p.isHost ? { ...p, hasVideo: true } : p)),
        );
        addSystemMessage("Screen sharing started 🖥️");
      } catch {
        toast.error("Screen share cancelled or not supported");
      }
    }
  };

  const muteParticipant = (uid: number | string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, isMuted: !p.isMuted } : p)),
    );
    toast.info("Mute toggled");
    setParticipantMenuOpen(null);
  };

  const removeParticipant = async (uid: number | string) => {
    await fetch("/api/live/kick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, uid: Number(uid) }),
    }).catch(() => {});
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== uid));
    setParticipants((prev) => prev.filter((p) => p.uid !== uid));
    addSystemMessage("Participant removed from class");
    toast.success("Participant removed — they'll be kicked shortly");
    setParticipantMenuOpen(null);
  };

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    msgCounterRef.current += 1;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${msgCounterRef.current}-${Date.now()}`,
        sender: "You (Host)",
        text: chatMsg,
        isHost: true,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatMsg("");
  };

  const handleEndClass = () => setShowEndConfirm(true);

  const confirmEnd = async () => {
    setShowEndConfirm(false);
    setEnding(true);
    if (screenTrackRef.current) {
      await clientRef.current?.unpublish(screenTrackRef.current);
      screenTrackRef.current.close();
    }
    localAudioRef.current?.close();
    localVideoRef.current?.close();
    await clientRef.current?.leave();
    await endLiveClass(classId);
    const data = await getClassAttendees(classId);
    setAttendees(data ?? []);
    setEnding(false);
    setClassEnded(true);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/live/${classId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Invite link copied!");
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
          <p className="text-white font-black font-nunito">
            Setting up your classroom...
          </p>
        </div>
      </div>
    );

  if (!liveClass)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white font-black">Class not found</p>
      </div>
    );

  // ── Post-class attendees screen ───────────────────────────────────────────
  if (classEnded)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden">
          <div className="bg-linear-to-br from-brand-purple to-hot-pink p-6 text-center">
            <div className="text-5xl mb-3">🎓</div>
            <h2 className="text-2xl font-black text-white font-nunito">
              Class Ended!
            </h2>
            <p className="text-white/80 font-bold text-sm mt-1">
              {liveClass.title}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 px-6 py-4 border-b border-gray-800">
            {[
              { val: attendees.length, label: "Total", color: "text-white" },
              {
                val: attendees.filter((a) => a.child_id).length,
                label: "Logged In",
                color: "text-grass-green",
              },
              {
                val: attendees.filter((a) => !a.child_id).length,
                label: "Guests",
                color: "text-sunshine-yellow",
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className={`text-2xl font-black font-nunito ${s.color}`}>
                  {s.val}
                </p>
                <p className="text-xs font-bold text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Attendee list */}
          <div className="p-4 max-h-72 overflow-y-auto space-y-2">
            {attendees.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">😶</div>
                <p className="text-gray-400 font-bold text-sm">
                  No attendees recorded yet
                </p>
                <p className="text-gray-600 text-xs font-bold mt-1">
                  Students who joined will appear here
                </p>
              </div>
            ) : (
              attendees.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-2xl"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-sm shrink-0">
                    {a.child_id ? "👦" : "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-black truncate">
                      {a.username ?? "Guest"}
                    </p>
                    <p className="text-gray-500 text-[10px] font-bold">
                      Joined{" "}
                      {new Date(a.joined_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-grass-green/10">
                    <CalendarCheck className="w-3 h-3 text-grass-green" />
                    <span className="text-grass-green text-[10px] font-black">
                      Attended
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => router.push("/school/live")}
              className="w-full py-3 rounded-2xl bg-brand-purple text-white font-black text-sm shadow-lg shadow-brand-purple/20 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-4 h-4" /> Back to Classes
            </button>
          </div>
        </div>
      </div>
    );

  const totalCount = participants.length;

  // ── Main room UI ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* End confirm overlay — must be outside the constrained wrapper so it covers full screen */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-[28px] p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <PhoneOff className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-black text-xl font-nunito mb-2">
              End Class?
            </h3>
            <p className="text-gray-400 font-bold text-sm mb-6">
              This will end the class for all participants and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-black text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnd}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm transition-all cursor-pointer shadow-lg shadow-red-500/30"
              >
                End Class
              </button>
            </div>
          </div>
        </div>
      )}

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
              {liveClass.subject && (
                <p className="text-gray-400 text-xs font-bold">
                  {liveClass.subject}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-xl text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-black">{duration}</span>
            </div>
            <button
              onClick={copyInviteLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-grass-green" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied!" : "Invite"}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-xl text-gray-300 text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              {totalCount}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Video area */}
          <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden min-h-0">
            {/* Unified grid — host tile + all remote tiles together */}
            <VideoGrid
              localVideoRef={localVideoContainerRef}
              camOn={camOn}
              micOn={micOn}
              screenSharing={screenSharing}
              remoteUsers={remoteUsers}
              participants={participants}
              uidNameMap={uidNameMap}
            />
          </div>

          {/* Side panel */}
          {(showChat || showParticipants) && (
            <div className="absolute inset-0 sm:relative sm:inset-auto sm:w-80 bg-gray-900 sm:border-l sm:border-gray-800 flex flex-col z-30">
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
                    People ({participants.length})
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
                        No messages yet. Say hi! 👋
                      </p>
                    )}
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={msg.sender === "System" ? "text-center" : ""}
                      >
                        {msg.sender === "System" ? (
                          <p className="text-gray-500 text-[10px] font-bold">
                            {msg.text}
                          </p>
                        ) : (
                          <div
                            className={`flex flex-col ${msg.isHost ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[10px] font-bold text-gray-500 mb-1">
                              {msg.sender} · {msg.time}
                            </span>
                            <div
                              className={`px-3 py-2 rounded-2xl max-w-[85%] ${msg.isHost ? "bg-brand-purple text-white" : "bg-gray-800 text-gray-200"}`}
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
                      className="p-2 bg-brand-purple rounded-xl text-white hover:bg-brand-purple/80 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {showParticipants && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {participants.map((p) => (
                    <div
                      key={String(p.uid)}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-sm">
                          {p.isHost ? "👨‍🏫" : "👦"}
                        </div>
                        <div>
                          <p className="text-white text-xs font-black">
                            {p.name}
                          </p>
                          <p
                            className={`text-[10px] font-bold ${p.isHost ? "text-sunshine-yellow" : p.isMuted ? "text-red-400" : "text-grass-green"}`}
                          >
                            {p.isHost
                              ? "Host"
                              : p.isMuted
                                ? "Muted"
                                : "Speaking"}
                          </p>
                        </div>
                      </div>
                      {!p.isHost && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setParticipantMenuOpen(
                                participantMenuOpen === String(p.uid)
                                  ? null
                                  : String(p.uid),
                              )
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {participantMenuOpen === String(p.uid) && (
                            <div className="absolute right-0 bottom-8 bg-gray-700 rounded-2xl shadow-xl overflow-hidden z-20 w-40">
                              <button
                                onClick={() => muteParticipant(p.uid)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-gray-200 hover:bg-gray-600 transition-all cursor-pointer"
                              >
                                {p.isMuted ? (
                                  <Volume2 className="w-3.5 h-3.5" />
                                ) : (
                                  <VolumeX className="w-3.5 h-3.5" />
                                )}
                                {p.isMuted ? "Unmute" : "Mute"}
                              </button>
                              <button
                                onClick={() => removeParticipant(p.uid)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-gray-600 transition-all cursor-pointer"
                              >
                                <UserMinus className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
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
                {camOn ? "Stop Video" : "Start Video"}
              </span>
            </button>

            <button
              onClick={toggleScreenShare}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all cursor-pointer ${screenSharing ? "bg-grass-green/20 text-grass-green border border-grass-green/30" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
            >
              {screenSharing ? (
                <MonitorOff className="w-5 h-5" />
              ) : (
                <MonitorUp className="w-5 h-5" />
              )}
              <span className="text-[10px] font-black">
                {screenSharing ? "Stop Share" : "Share Screen"}
              </span>
            </button>

            <button
              onClick={() => {
                setShowChat(!showChat);
                setShowParticipants(false);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all cursor-pointer relative ${showChat ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] font-black">Chat</span>
              {messages.filter((m) => m.sender !== "System").length > 0 &&
                !showChat && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-hot-pink rounded-full" />
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
              onClick={copyInviteLink}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white transition-all cursor-pointer"
            >
              {copied ? (
                <Check className="w-5 h-5 text-grass-green" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span className="text-[10px] font-black">Invite</span>
            </button>

            <button
              onClick={handleEndClass}
              disabled={ending}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-red-500/30"
            >
              {ending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PhoneOff className="w-5 h-5" />
              )}
              <span className="text-[10px] font-black">End Class</span>
            </button>
          </div>
        </div>
      </div>
      {/* end max-w-6xl wrapper */}
    </div>
  );
}

// ── VideoGrid ─────────────────────────────────────────────────────────────────
// Google Meet-style: every participant gets a tile. Camera-off = avatar tile.
function VideoGrid({
  localVideoRef,
  camOn,
  micOn,
  screenSharing,
  remoteUsers,
  participants,
  uidNameMap,
}: {
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  camOn: boolean;
  micOn: boolean;
  screenSharing: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
  participants: Participant[];
  uidNameMap: Record<number, { name: string; avatar: string | null }>;
}) {
  const remotePeers = participants.filter((p) => !p.isHost);
  const total = 1 + remotePeers.length;

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
      {/* Host tile */}
      <div className="relative bg-gray-900 rounded-[20px] overflow-hidden min-h-0">
        <div ref={localVideoRef} className="w-full h-full" />
        {!camOn && !screenSharing && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-brand-purple/20 flex items-center justify-center text-3xl">
                👨‍🏫
              </div>
              <p className="text-white text-xs font-black font-nunito">
                Camera Off
              </p>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <div className="px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-sunshine-yellow" />
            <span className="text-white text-[10px] font-black">
              You (Host)
            </span>
          </div>
          {!micOn && (
            <div className="p-1 bg-red-500/80 rounded-md">
              <MicOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          {screenSharing && (
            <div className="px-2 py-0.5 bg-grass-green/80 rounded-lg flex items-center gap-1">
              <MonitorUp className="w-2.5 h-2.5 text-white" />
              <span className="text-white text-[10px] font-black">Sharing</span>
            </div>
          )}
        </div>
      </div>

      {/* One tile per remote participant — video if publishing, avatar if not */}
      {remotePeers.map((p) => {
        const info = uidNameMap[p.uid as number];
        const name = info?.name ?? p.name;
        const avatar = info?.avatar ?? null;
        return (
          <div
            key={String(p.uid)}
            className="relative bg-gray-800 rounded-[20px] overflow-hidden min-h-0"
          >
            {/* Always render the video div so Agora can play into it */}
            <div id={`remote-${p.uid}`} className="w-full h-full" />
            {/* Avatar overlay — driven by p.hasVideo state, not mutable ref */}
            {!p.hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="flex flex-col items-center gap-2">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-brand-purple/40"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-brand-purple/20 flex items-center justify-center text-2xl font-black text-white">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="text-white text-xs font-black font-nunito">
                    {name}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <div className="px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg">
                <span className="text-white text-[10px] font-black">
                  {name}
                </span>
              </div>
              {p.isMuted && (
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
