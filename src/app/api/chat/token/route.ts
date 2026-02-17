import { NextResponse } from "next/server";
import { StreamChat } from "stream-chat";
import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "@/actions/auth";

export async function POST() {
  const apiKey = process.env.STREAM_CHAT_API_KEY;
  const apiSecret = process.env.STREAM_CHAT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Stream Chat environment variables are missing" },
      { status: 500 }
    );
  }

  const childSession = await getChildSession();

  if (!childSession || !childSession.id) {
    return NextResponse.json(
      { error: "Chat is only available for logged in children" },
      { status: 401 }
    );
  }

  const { data: child, error } = await supabase
    .from("children")
    .select("child_id, username, name, avatar, age, level, country")
    .eq("child_id", childSession.id)
    .single();

  if (error || !child) {
    return NextResponse.json(
      { error: "Child profile not found" },
      { status: 404 }
    );
  }

  const serverClient = StreamChat.getInstance(apiKey, apiSecret);

  const streamUser = {
    id: child.child_id,
    name: child.name || child.username,
    image: child.avatar || undefined,
    username: child.username,
    age: child.age,
    country: child.country,
    level: child.level,
  } as const;

  await serverClient.upsertUser(streamUser);

  const token = serverClient.createToken(child.child_id);

  return NextResponse.json({
    token,
    apiKey,
    user: {
      id: streamUser.id,
      name: streamUser.name,
      image: streamUser.image,
      username: streamUser.username,
      age: streamUser.age,
      country: streamUser.country,
      level: streamUser.level,
    },
  });
}
