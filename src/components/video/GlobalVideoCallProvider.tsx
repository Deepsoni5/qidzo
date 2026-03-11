"use client";

import { ReactNode } from "react";
import VideoCallProvider from "./VideoCallProvider";

/**
 * Global wrapper for VideoCallProvider
 * This component wraps the entire app to enable video calls from any page
 */
export default function GlobalVideoCallProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <VideoCallProvider>{children}</VideoCallProvider>;
}
