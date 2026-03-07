"use client";

import { ReactNode, useEffect } from "react";
import { StreamVideo } from "@stream-io/video-react-sdk";
import { useVideoClient } from "@/hooks/useVideoClient";
import { useCallManager } from "@/hooks/useCallManager";
import IncomingCallModal from "./IncomingCallModal";
import ActiveCallScreen from "./ActiveCallScreen";

interface VideoCallProviderProps {
  children: ReactNode;
  otherUserId?: string;
}

// Inner component that uses hooks requiring StreamVideo context
function VideoCallManager({ children }: { children: ReactNode }) {
  const {
    activeCall,
    incomingCall,
    isInCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  } = useCallManager();

  // Expose call functions globally for the chat header to use
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).qidzoStartVideoCall = (userId: string) =>
        startCall(userId, true);
      (window as any).qidzoStartAudioCall = (userId: string) =>
        startCall(userId, false);
    }
  }, [startCall]);

  return (
    <>
      {children}

      {/* Incoming Call Modal */}
      {incomingCall && !isInCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Active Call Screen */}
      {activeCall && isInCall && (
        <ActiveCallScreen call={activeCall} onLeave={endCall} />
      )}
    </>
  );
}

export default function VideoCallProvider({
  children,
}: VideoCallProviderProps) {
  const { client, isLoading } = useVideoClient();

  // Don't render until client is ready
  if (isLoading || !client) {
    return <>{children}</>;
  }

  return (
    <StreamVideo client={client}>
      <VideoCallManager>{children}</VideoCallManager>
    </StreamVideo>
  );
}
