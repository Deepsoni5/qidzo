"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Call } from "@stream-io/video-react-sdk";

interface IncomingCallModalProps {
  call: Call;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({
  call,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const [callerName, setCallerName] = useState("Someone");
  const [callerAvatar, setCallerAvatar] = useState<string | null>(null);

  // Check if it's an audio-only call
  const isAudioOnly = call.state.custom?.isAudioOnly === true;

  useEffect(() => {
    // Get caller info
    const members = call.state.members;
    const caller = members.find((m) => m.user.id !== call.currentUserId);

    if (caller) {
      setCallerName(caller.user.name || caller.user.id);
      setCallerAvatar(caller.user.image || null);
    }

    // Play ringing sound
    const audio = new Audio("/sounds/incoming-call.mp3");
    audio.loop = true;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [call]);

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-linear-to-br from-brand-purple via-hot-pink to-brand-purple p-8 rounded-[40px] shadow-2xl max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300">
        {/* Caller Avatar */}
        <div className="relative mb-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 overflow-hidden flex items-center justify-center animate-pulse">
            {callerAvatar ? (
              <img
                src={callerAvatar}
                alt={callerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-black text-white">
                {callerName[0]?.toUpperCase()}
              </span>
            )}
          </div>
          {/* Ringing indicator */}
          <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping" />
        </div>

        {/* Caller Info */}
        <h2 className="text-2xl font-black font-nunito text-white mb-2">
          {callerName}
        </h2>
        <p className="text-white/90 font-bold text-sm mb-8 flex items-center justify-center gap-2">
          {isAudioOnly ? (
            <>
              <Phone className="w-4 h-4" />
              Incoming Audio Call
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Incoming Video Call
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject Button */}
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg cursor-pointer"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-grass-green hover:bg-grass-green/90 active:scale-95 transition-all flex items-center justify-center shadow-lg cursor-pointer animate-pulse"
          >
            <Phone className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
