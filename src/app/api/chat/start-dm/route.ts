import { NextResponse } from "next/server";
import { StreamChat } from "stream-chat";
import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "@/actions/auth";

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => null);

  if (!body || (!body.targetUsername && !body.targetChildId)) {
    return NextResponse.json(
      { error: "targetUsername or targetChildId is required" },
      { status: 400 }
    );
  }

  const currentChildId = String(childSession.id);

  let targetChildId: string | null = null;

  if (body.targetChildId) {
    targetChildId = String(body.targetChildId);
  } else if (body.targetUsername) {
    const { data: target, error: targetError } = await supabase
      .from("children")
      .select("child_id")
      .eq("username", body.targetUsername)
      .single();

    if (targetError || !target) {
      return NextResponse.json(
        { error: "Target child not found" },
        { status: 404 }
      );
    }

    targetChildId = target.child_id;
  }

  if (!targetChildId) {
    return NextResponse.json(
      { error: "Unable to resolve target child" },
      { status: 400 }
    );
  }

  if (targetChildId === currentChildId) {
    return NextResponse.json(
      { error: "Cannot start a DM with yourself" },
      { status: 400 }
    );
  }

  const members = [currentChildId, targetChildId].sort();
  const channelId = `dm_${members[0]}_${members[1]}`;

  const serverClient = StreamChat.getInstance(apiKey, apiSecret);

  // Ensure both users exist in Stream before creating the channel
  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("child_id, username, name, avatar")
    .in("child_id", members);

  if (childrenError || !children || children.length !== 2) {
    return NextResponse.json(
      { error: "Unable to load chat participants" },
      { status: 404 }
    );
  }

  const usersPayload = children.map((c) => ({
    id: c.child_id,
    name: c.name || c.username,
    image: c.avatar || undefined,
    username: c.username,
  }));

  await serverClient.upsertUsers(usersPayload);

  const usernames = Object.fromEntries(
    children.map((c) => [c.child_id, c.username])
  );

  const channelData: any = {
    members,
    created_by_id: currentChildId,
    usernames,
  };

  const channel = serverClient.channel("messaging", channelId, channelData);

  const initialMessage =
    typeof body.initialMessage === "string"
      ? body.initialMessage.trim()
      : "";

  await channel.create();

  if (initialMessage) {
    try {
      await (channel as any).sendMessage({
        text: initialMessage,
        user_id: currentChildId,
      });
    } catch {
      // ignore send errors, channel is still created
    }
  }

  return NextResponse.json({
    channelId,
  });
}
