import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_please_change_in_production",
);

export async function POST(req: NextRequest) {
  try {
    const { classId } = await req.json();
    if (!classId) return NextResponse.json({ success: true });

    const token = req.cookies.get("qidzo_child_token")?.value;
    if (!token) return NextResponse.json({ success: true });

    let childId: string | null = null;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      childId = payload.id as string;
    } catch {
      return NextResponse.json({ success: true });
    }

    if (!childId) return NextResponse.json({ success: true });

    // Set left_at so uid-names no longer returns this student (removes from live grid)
    // but keep the record + agora_uid so it appears in the end-of-class attendance list
    await supabase
      .from("live_class_attendees")
      .update({ left_at: new Date().toISOString() })
      .eq("class_id", classId)
      .eq("child_id", childId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
