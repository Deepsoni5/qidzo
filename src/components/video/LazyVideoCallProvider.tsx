"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Lazy load video call provider to reduce initial bundle size
const GlobalVideoCallProvider = dynamic(
  () => import("@/components/video/GlobalVideoCallProvider"),
  { ssr: false },
);

export default function LazyVideoCallProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <GlobalVideoCallProvider>{children}</GlobalVideoCallProvider>;
}
