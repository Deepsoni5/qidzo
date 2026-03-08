import { useState, useCallback, useEffect } from "react";
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

  // Listen for call end events and state changes
  useEffect(() => {
    if (!activeCall) return;

    const handleCallEnded = () => {
      console.log("Call ended event received");
      setActiveCall(null);
      setIsInCall(false);
      toast("Call ended");
    };

    const handleCallAccepted = () => {
      console.log("Call accepted - joining now");
      // When the other person accepts, join the call
      if (!isInCall) {
        activeCall
          .join()
          .then(() => {
            setIsInCall(true);
            toast.success("Call connected");
          })
          .catch((error) => {
            console.error("Error joining after accept:", error);
          });
      }
    };

    // Listen for call end events
    activeCall.on("call.ended", handleCallEnded);
    activeCall.on("call.session_ended", handleCallEnded);
    activeCall.on("call.accepted", handleCallAccepted);

    return () => {
      activeCall.off("call.ended", handleCallEnded);
      activeCall.off("call.session_ended", handleCallEnded);
      activeCall.off("call.accepted", handleCallAccepted);
    };
  }, [activeCall, isInCall]);

  // Start a call (outgoing)
  const startCall = useCallback(
    async (targetUserId: string, isVideo: boolean = true) => {
      if (!client || !connectedUser) {
        toast.error("Video client not ready");
        return null;
      }

      try {
        const callId = `${connectedUser.id}-${targetUserId}-${Date.now()}`;
        const call = client.call("default", callId);

        await call.getOrCreate({
          ring: true,
          data: {
            members: [{ user_id: connectedUser.id }, { user_id: targetUserId }],
            custom: {
              isAudioOnly: !isVideo,
            },
          },
        });

        // For video calls, try to enable camera (handle errors gracefully)
        if (isVideo) {
          try {
            await call.camera.enable();
          } catch (error) {
            console.warn(
              "Camera not available, continuing without video:",
              error,
            );
            toast.error("Camera not available. Continuing as audio call.");
          }
        } else {
          // For audio-only calls, disable camera
          await call.camera.disable();
        }

        // DON'T join yet - wait for the other person to accept
        // The call will auto-join when they accept
        setActiveCall(call);
        setIsInCall(false); // Not in call yet, just ringing

        toast.success(isVideo ? "Calling..." : "Calling...");
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
      // Check if it's an audio-only call
      const isAudioOnly = incomingCall.state.custom?.isAudioOnly === true;

      if (isAudioOnly) {
        await incomingCall.camera.disable();
      } else {
        // For video calls, try to enable camera (handle errors gracefully)
        try {
          await incomingCall.camera.enable();
        } catch (error) {
          console.warn(
            "Camera not available, continuing without video:",
            error,
          );
          toast.error("Camera not available. Continuing as audio call.");
        }
      }

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
      await incomingCall.reject();
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
      // End the call for everyone
      await activeCall.endCall();
      setActiveCall(null);
      setIsInCall(false);
      toast("Call ended");
    } catch (error) {
      console.error("Error ending call:", error);
      // Even if there's an error, clean up local state
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
