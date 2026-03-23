import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Returns a map of { [agoraUid]: { name, avatar } } for a given classId
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;

  const { data: attendees, error } = await supabase
    .from("live_class_attendees")
    .select("agora_uid, child_id")
    .eq("class_id", classId)
    .not("agora_uid", "is", null)
    .is("left_at", null);

  if (error) {
    return NextResponse.json({ map: {} });
  }

  const childIds = (attendees ?? [])
    .map((r) => r.child_id)
    .filter(Boolean) as string[];

  let childMap: Record<string, { username: string; avatar: string | null }> =
    {};
  if (childIds.length > 0) {
    const { data: children } = await supabase
      .from("children")
      .select("child_id, username, avatar")
      .in("child_id", childIds);
    (children ?? []).forEach((c) => {
      childMap[c.child_id] = { username: c.username, avatar: c.avatar ?? null };
    });
  }

  const map: Record<number, { name: string; avatar: string | null }> = {};
  for (const row of attendees ?? []) {
    if (row.agora_uid != null) {
      const child = childMap[row.child_id];
      map[row.agora_uid] = {
        name: child?.username ?? `Student ${row.agora_uid}`,
        avatar: child?.avatar ?? null,
      };
    }
  }

  return NextResponse.json({ map });
}
