"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Radio,
  Clock,
  Globe,
  Lock,
  Loader2,
  BookOpen,
  Calendar,
  RefreshCw,
  Users,
} from "lucide-react";

interface LiveStream {
  id: string;
  class_id: string;
  title: string;
  subject: string | null;
  description: string | null;
  class: string | null;
  status: "live" | "scheduled";
  is_private: boolean;
  scheduled_at: string | null;
  started_at: string | null;
  school: {
    name: string;
    logo_url: string | null;
    school_id: string;
  } | null;
}

export default function TutorialsTab() {
  const router = useRouter();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStreams = async (bust = false) => {
    try {
      const url = bust ? "/api/live/streams?bust=1" : "/api/live/streams";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setStreams(data.streams || []);
    } catch {
      setStreams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStreams(true);
  };

  const liveStreams = streams.filter((s) => s.status === "live");
  const scheduledStreams = streams.filter((s) => s.status === "scheduled");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
          <p className="font-black text-gray-400 font-nunito">
            Loading streams...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-500">
            {liveStreams.length > 0
              ? `🔴 ${liveStreams.length} live right now`
              : scheduledStreams.length > 0
                ? `${scheduledStreams.length} upcoming`
                : "No streams available"}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer text-gray-500 hover:text-brand-purple"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Empty state */}
      {streams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-24 h-24 rounded-full bg-brand-purple/10 flex items-center justify-center text-5xl">
            🎥
          </div>
          <p className="font-black text-xl text-gray-700 font-nunito">
            No live classes right now
          </p>
          <p className="text-sm font-bold text-gray-400 text-center max-w-xs">
            Check back later — your teachers will start live classes here 🎓
          </p>
        </div>
      )}

      {/* Live now */}
      {liveStreams.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-xs font-black text-red-500 uppercase tracking-widest">
              Live Now
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl">
            {liveStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onJoin={() => router.push(`/live/${stream.class_id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Scheduled */}
      {scheduledStreams.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-sunshine-yellow" />
            <h2 className="text-xs font-black text-sunshine-yellow uppercase tracking-widest">
              Upcoming
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl">
            {scheduledStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onJoin={() => router.push(`/live/${stream.class_id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StreamCard({
  stream,
  onJoin,
}: {
  stream: LiveStream;
  onJoin: () => void;
}) {
  const isLive = stream.status === "live";

  return (
    <div
      className="group bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
      onClick={onJoin}
    >
      {/* Top strip */}
      <div
        className={`h-1.5 w-full ${isLive ? "bg-red-500 animate-pulse" : "bg-sunshine-yellow"}`}
      />

      {/* Thumbnail / banner area */}
      <div
        className={`relative h-32 flex items-center justify-center ${isLive ? "bg-linear-to-br from-red-950 to-gray-900" : "bg-linear-to-br from-gray-900 to-gray-800"}`}
      >
        {/* School logo */}
        {stream.school?.logo_url ? (
          <img
            src={stream.school.logo_url}
            alt={stream.school.name}
            className="w-14 h-14 rounded-2xl object-contain bg-white/10 p-1.5 shadow-lg"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-lg">
            🏫
          </div>
        )}

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 rounded-full shadow-lg shadow-red-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">
              Live
            </span>
          </div>
        )}

        {/* Privacy badge */}
        <div
          className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${stream.is_private ? "bg-black/50 text-gray-300" : "bg-sky-blue/20 text-sky-blue border border-sky-blue/30"}`}
        >
          {stream.is_private ? (
            <Lock className="w-2.5 h-2.5" />
          ) : (
            <Globe className="w-2.5 h-2.5" />
          )}
          {stream.is_private ? "Private" : "Public"}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

        {/* School name at bottom */}
        {stream.school?.name && (
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-white text-[10px] font-black truncate opacity-80">
              {stream.school.name}
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Subject pill */}
        <div className="flex flex-wrap gap-2 mb-2">
          {stream.subject && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-purple/10 rounded-full">
              <BookOpen className="w-3 h-3 text-brand-purple" />
              <span className="text-[10px] font-black text-brand-purple">
                {stream.subject}
              </span>
            </div>
          )}
          {stream.class && stream.class !== "All" && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-hot-pink/10 rounded-full">
              <Users className="w-3 h-3 text-hot-pink" />
              <span className="text-[10px] font-black text-hot-pink">
                {stream.class}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-black text-gray-900 font-nunito text-base leading-tight mb-1 line-clamp-2">
          {stream.title}
        </h3>

        {/* Description */}
        {stream.description && (
          <p className="text-xs font-bold text-gray-400 line-clamp-2 mb-3">
            {stream.description}
          </p>
        )}

        {/* Time info */}
        {isLive && stream.started_at && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Started{" "}
            {new Date(stream.started_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {!isLive && stream.scheduled_at && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-sunshine-yellow mb-3">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(stream.scheduled_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
        {!isLive && !stream.scheduled_at && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-3 bg-gray-50 rounded-xl px-3 py-2">
            <Clock className="w-3.5 h-3.5 shrink-0 text-sunshine-yellow" />
            <span>
              No time set yet — keep an eye out, your instructor will start this
              soon! 👀
            </span>
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
          className={`w-full py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
            isLive
              ? "bg-red-500 text-white shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {isLive ? (
            <span className="flex items-center justify-center gap-2">
              <Radio className="w-4 h-4" /> Join Now
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" /> Scheduled
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
