import { useState, useCallback } from "react";
import {
  Call,
  useConnectedUser,
  useCalls,
  useStreamVideoClient,
} from "@stream-io/video-react-sdk";
import { toast } from "sonner";

export function useCallManager() {
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  // Get client and connected user from context
  const client = useStreamVideoClient();
  const connectedUser = useConnectedUser();

  // Get all calls (incoming and outgoing)
  const calls = useCalls();

  // Find incoming call (ringing call that we didn't create)
  const incomingCall =
    calls.find(
      (call) =>
        call.state.callingState === "ringing" &&
        call.state.createdBy?.id !== connectedUser?.id,
    ) || null;

  // Start a call (outgoing)
  const startCall = useCallback(
    async (targetUserId: string, isVideo: boolean = true) => {
      if (!client || !connectedUser) {
        toast.error("Video client not ready");
        return null;
      }

      try {
        const callId = `${connectedUser.id}-${targetUserId}-${Date.now()}`;
        // Use "default" for both video and audio calls
        // The difference is handled by camera/microphone settings
        const call = client.call("default", callId);

        await call.getOrCreate({
          ring: true,
          data: {
            members: [{ user_id: connectedUser.id }, { user_id: targetUserId }],
          },
        });

        // For audio-only calls, disable camera before joining
        if (!isVideo) {
          await call.camera.disable();
        }

        await call.join();
        setActiveCall(call);
        setIsInCall(true);

        toast.success(isVideo ? "Video call started" : "Audio call started");
        return call;
      } catch (error) {
        console.error("Error starting call:", error);
        toast.error("Failed to start call");
        return null;
      }
    },
    [client, connectedUser],
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      await incomingCall.join();
      setActiveCall(incomingCall);
      setIsInCall(true);
      toast.success("Call connected");
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to join call");
    }
  }, [incomingCall]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      await incomingCall.leave();
      toast("Call declined");
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  }, [incomingCall]);

  // End active call
  const endCall = useCallback(async () => {
    if (!activeCall) return;

    try {
      await activeCall.leave();
      await activeCall.endCall();
      setActiveCall(null);
      setIsInCall(false);
      toast("Call ended");
    } catch (error) {
      console.error("Error ending call:", error);
      setActiveCall(null);
      setIsInCall(false);
    }
  }, [activeCall]);

  return {
    activeCall,
    incomingCall,
    isInCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
