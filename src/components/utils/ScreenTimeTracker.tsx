"use client";

import { useEffect, useRef } from "react";
import { recordScreenTime } from "@/actions/screen-time";

export default function ScreenTimeTracker() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const PING_INTERVAL = 60 * 1000; // 60 seconds

  useEffect(() => {
    // Function to record time
    const trackTime = async () => {
      // Only track if the document is visible (active tab)
      if (document.visibilityState === "visible") {
        try {
          const result = await recordScreenTime(60);
          if (result.success) {
            console.log("Screen time recorded (60s) ✨");
          } else {
            console.log("Screen time skipped:", result.error);
          }
        } catch (error) {
          // Silently fail to not disturb user experience
          console.error("Failed to record screen time heartbeat");
        }
      }
    };

    // Initial delay before first track to avoid firing on every tiny page load
    const timeoutId = setTimeout(() => {
      console.log("Activity tracker starting... 🕰️");
      trackTime(); // Track first minute
      
      // Then setup the recurring interval
      intervalRef.current = setInterval(trackTime, PING_INTERVAL);
    }, PING_INTERVAL);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
