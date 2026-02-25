"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function SSOSchoolCallback() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const run = async () => {
      if (!user) {
        toast.error("Not signed in", {
          description: "Please log in to continue.",
        });
        router.replace("/school/sign-in");
        return;
      }

      const role = (user.unsafeMetadata as any)?.role;
      if (role && role !== "school") {
        toast.error("Access denied", {
          description: "This account is not a School account.",
        });
        router.replace("/sign-in");
        return;
      }

      const { data } = await supabase
        .from("schools")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (data) {
        router.replace("/school/dashboard");
      } else {
        toast.error("Email not found", {
          description: "Please sign up to create your School account.",
        });
        router.replace("/school/sign-up");
      }
    };

    run();
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-gray-100 text-center">
        <div className="text-3xl">🔄</div>
        <p className="mt-2 text-gray-600 font-medium">
          Checking your School account…
        </p>
      </div>
    </div>
  );
}

