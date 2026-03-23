import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Lightweight endpoint for students to poll class status
// Returns just the status field — no heavy joins
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;
  const { data } = await supabase
    .from("live_classes")
    .select("status")
    .eq("class_id", classId)
    .single();

  return NextResponse.json({ status: data?.status ?? "ended" });
}
