import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { invalidateParentCache } from "@/actions/parent";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const childId = body?.childId as string | undefined;
    const rawName = body?.name as string | undefined;
    const rawUsername = body?.username as string | undefined;
    const rawBio = body?.bio as string | undefined | null;
    const rawAvatar = body?.avatar as string | undefined | null;

    const name = rawName?.trim();
    const username = rawUsername?.trim();
    const bio = rawBio ? rawBio.trim() : null;
    const avatar = rawAvatar || null;

    if (!childId || !name || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: parentData, error: parentError } = await supabase
      .from("parents")
      .select("parent_id")
      .eq("clerk_id", user.id)
      .single();

    if (parentError || !parentData) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 403 }
      );
    }

    const { data: existingChild, error: childError } = await supabase
      .from("children")
      .select("id, username")
      .eq("id", childId)
      .eq("parent_id", parentData.parent_id)
      .single();

    if (childError || !existingChild) {
      return NextResponse.json(
        { error: "Child not found for this parent" },
        { status: 404 }
      );
    }

    if (existingChild.username !== username) {
      const { data: usernameRow, error: usernameError } = await supabase
        .from("children")
        .select("id")
        .eq("username", username)
        .neq("id", childId)
        .maybeSingle();

      if (usernameError && usernameError.code !== "PGRST116") {
        return NextResponse.json(
          { error: "Error checking username" },
          { status: 500 }
        );
      }

      if (usernameRow) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    const { error: updateError } = await supabase
      .from("children")
      .update({
        name,
        username,
        bio,
        avatar,
      })
      .eq("id", childId)
      .eq("parent_id", parentData.parent_id);

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    await invalidateParentCache(user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

