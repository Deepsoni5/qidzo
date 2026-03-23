import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Redis-backed kick list per class
// Host POSTs { classId, uid } to kick a student
// Student GETs ?classId=&uid= to check if they've been kicked

export async function POST(req: NextRequest) {
  try {
    const { classId, uid } = await req.json();
    if (!classId || uid == null)
      return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const key = `live:kicked:${classId}`;
    const existing = (await redis.get<number[]>(key)) ?? [];
    const updated = [...new Set([...existing, Number(uid)])];
    await redis.set(key, updated, { ex: 3600 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const uid = searchParams.get("uid");
  if (!classId || !uid) return NextResponse.json({ kicked: false });

  const key = `live:kicked:${classId}`;
  const list = (await redis.get<number[]>(key)) ?? [];
  return NextResponse.json({ kicked: list.includes(Number(uid)) });
}
