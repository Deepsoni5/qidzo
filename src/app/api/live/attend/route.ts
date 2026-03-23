import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { jwtVerify } from "jose";
import { invalidateCache } from "@/lib/redis";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_please_change_in_production",
);

export async function POST(req: NextRequest) {
  try {
    const { classId, uid } = await req.json();
    if (!classId)
      return NextResponse.json({ error: "Missing classId" }, { status: 400 });

    // child_id is NOT NULL in schema — only record if student is logged in
    const token = req.cookies.get("qidzo_child_token")?.value;
    if (!token) {
      // Guest viewer — schema requires child_id so we can't insert, just skip
      return NextResponse.json({ success: true });
    }

    let childId: string | null = null;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      childId = payload.id as string;
    } catch {
      // invalid token — skip
      return NextResponse.json({ success: true });
    }

    if (!childId) return NextResponse.json({ success: true });

    // Upsert using the actual schema columns: class_id, child_id, agora_uid, joined_at
    // Unique constraint is (class_id, child_id)
    const { error } = await supabase.from("live_class_attendees").upsert(
      {
        class_id: classId,
        child_id: childId,
        agora_uid: uid ?? null,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "class_id,child_id" },
    );

    if (error) {
      console.error("[attend] upsert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate school cache so attendee count refreshes
    const { data: cls } = await supabase
      .from("live_classes")
      .select("school_uuid")
      .eq("class_id", classId)
      .single();
    if (cls?.school_uuid) {
      await invalidateCache(`school:live_classes:${cls.school_uuid}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Attendance error:", err);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 },
    );
  }
}
