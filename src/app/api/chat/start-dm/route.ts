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

  // Plan gating: allow only up to 5 distinct DM partners for FREE/BASIC
  try {
    // 1) Fetch parent's plan for the current child
    const { data: childRow } = await supabase
      .from("children")
      .select("parent_id")
      .eq("child_id", currentChildId)
      .single();

    if (childRow?.parent_id) {
      const { data: parentRow } = await supabase
        .from("parents")
        .select("subscription_plan")
        .eq("parent_id", childRow.parent_id)
        .single();

      const planUpper = (parentRow?.subscription_plan || "FREE").toUpperCase();
      const isLimited = planUpper === "FREE" || planUpper === "BASIC";

      if (isLimited) {
        // 2) Query existing messaging channels for this child
        const channels = await serverClient.queryChannels(
          { type: "messaging", members: { $in: [currentChildId] } },
          { last_message_at: -1 },
          { limit: 100 }
        );

        const partners = new Set<string>();
        for (const ch of channels) {
          const id = (ch as any).id as string | undefined;
          if (!id || !id.startsWith("dm_")) continue;
          const parts = id.split("_");
          if (parts.length !== 3) continue;
          const a = parts[1];
          const b = parts[2];
          const other =
            a === currentChildId ? b : b === currentChildId ? a : undefined;
          if (other) partners.add(other);
        }

        // If target already has a DM with current child, allow
        const alreadyHasDM = partners.has(targetChildId);

        // Otherwise enforce max 5 distinct partners
        if (!alreadyHasDM && partners.size >= 5) {
          return NextResponse.json(
            {
              error:
                "You can only chat with 5 kids on your current plan. Please upgrade to Pro or Elite for unlimited chats.",
              code: "CHAT_LIMIT_REACHED",
              maxPartners: 5,
            },
            { status: 403 }
          );
        }
      }
    }
  } catch (gatingError) {
    // If gating fails unexpectedly, do not block chat creation
    // eslint-disable-next-line no-console
    console.error("Chat gating check failed:", gatingError);
  }

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
