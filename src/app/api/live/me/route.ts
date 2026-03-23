import { NextResponse } from "next/server";
import { getChildSession } from "@/actions/auth";

export async function GET() {
  const session = await getChildSession();
  if (!session) return NextResponse.json({ name: "You", avatar: null });
  return NextResponse.json({
    name: session.username ?? session.name ?? "You",
    avatar: session.avatar ?? null,
  });
}
