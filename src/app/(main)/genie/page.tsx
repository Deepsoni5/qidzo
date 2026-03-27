import GenieChat from "@/components/genie/GenieChat";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getChildSession } from "@/actions/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Genie AI | Qidzo Tutor",
  description: "Learn anything with Genie, your magical AI tutor!",
};

export default async function GeniePage() {
  const [user, kidSession] = await Promise.all([
    currentUser(),
    getChildSession(),
  ]);

  if (!user && !kidSession) {
    redirect("/");
  }

  // Subscription check
  const { checkParentSubscription } = await import("@/actions/parent");
  const { supabase } = await import("@/lib/supabaseClient");
  let plan = "FREE";

  if (user) {
    plan = (await checkParentSubscription()) || "FREE";
  } else if (kidSession) {
    const { data: child } = await supabase
      .from("children")
      .select("parent_id")
      .eq("child_id", (kidSession as any)?.id)
      .single();
    if (child) {
      plan = (await checkParentSubscription(child.parent_id)) || "FREE";
    }
  }

  if (plan !== "PRO" && plan !== "ELITE") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-24">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-purple transition-colors bg-white px-4 py-2 rounded-2xl w-fit mb-6 border-2 border-gray-100 shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>
        <GenieChat />
      </div>
    </div>
  );
}
