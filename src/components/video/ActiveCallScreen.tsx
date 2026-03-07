"use client";

import { useState, useEffect } from "react";
import {
  CallingState,
  StreamCall,
  useCallStateHooks,
  useCall,
  ParticipantView,
  Call,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Phone, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface ActiveCallScreenProps {
  call: Call;
  onLeave: () => void;
}

function CallUI({ onLeave }: { onLeave: () => void }) {
  const call = useCall();
  const {
    useCallCallingState,
    useParticipants,
    useLocalParticipant,
    useMicrophoneState,
    useCameraState,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const { camera, isMute: isCameraMuted } = useCameraState();

  const [callDuration, setCallDuration] = useState(0);

  const otherParticipant = participants.find(
    (p) => p.userId !== localParticipant?.userId,
  );

  // Call duration timer
  useEffect(() => {
    if (callingState !== CallingState.JOINED) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callingState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMute = async () => {
    try {
      await call?.microphone.toggle();
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  const toggleVideo = async () => {
    try {
      await call?.camera.toggle();
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  };

  if (callingState === CallingState.JOINING) {
    return (
      <div className="fixed inset-0 z-9999 bg-linear-to-br from-brand-purple to-hot-pink flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-white/30 border-t-white animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-lg">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-9999 bg-black">
      {/* Video Layout */}
      <div className="relative w-full h-full">
        {/* Remote Participant (Full Screen) */}
        {otherParticipant && (
          <div className="absolute inset-0">
            <ParticipantView
              participant={otherParticipant}
              ParticipantViewUI={null}
            />
          </div>
        )}

        {/* Local Participant (Picture-in-Picture) */}
        {localParticipant && (
          <div className="absolute top-4 right-4 w-32 h-40 sm:w-40 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
            <ParticipantView
              participant={localParticipant}
              ParticipantViewUI={null}
            />
          </div>
        )}

        {/* Top Bar - Participant Info */}
        <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-black text-sm">
                  {otherParticipant?.name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">
                  {otherParticipant?.name || "Friend"}
                </p>
                <p className="text-white/70 text-xs font-medium">
                  {formatDuration(callDuration)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-center gap-4">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isMicMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              }`}
            >
              {isMicMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>

            {/* End Call Button */}
            <button
              onClick={onLeave}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
            >
              <Phone className="w-7 h-7 text-white rotate-135" />
            </button>

            {/* Video Toggle Button */}
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isCameraMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              }`}
            >
              {isCameraMuted ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActiveCallScreen({
  call,
  onLeave,
}: ActiveCallScreenProps) {
  return (
    <StreamCall call={call}>
      <CallUI onLeave={onLeave} />
    </StreamCall>
  );
}
