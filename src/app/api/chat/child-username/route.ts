import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "@/actions/auth";

export async function POST(req: Request) {
  const session = await getChildSession();

  if (!session || !session.id) {
    return NextResponse.json(
      { error: "Chat is only available for logged in children" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const childId = body?.childId as string | undefined;

  if (!childId) {
    return NextResponse.json(
      { error: "childId is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("children")
    .select("username")
    .eq("child_id", childId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Child not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    username: data.username,
  });
}

