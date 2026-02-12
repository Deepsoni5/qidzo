"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");

    if (error || errorCode) {
      // Common Clerk SSO error: identifier_already_in_use
      // This happens when a Manual (Password) user tries to log in with Google
      if (errorCode === "identifier_already_in_use" || error?.includes("already_in_use")) {
        toast.error("Account Conflict Detected! 🔐", {
          description: "This email is already registered with a password. Please log in using your email and password instead.",
          duration: 8000,
        });
      } else {
        toast.error("Social Login Failed 🛑", {
          description: "Something went wrong during the social login. Please try again or use your password.",
        });
      }
      
      // Redirect back to sign-in page safely
      router.push("/sign-in");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[32px] shadow-xl border-4 border-white flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        </div>
        <div>
          <h2 className="text-2xl font-nunito font-black text-gray-800">Signing you in...</h2>
          <p className="text-gray-500 font-bold mt-1">Completing the social login magic ✨</p>
        </div>
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  );
}
