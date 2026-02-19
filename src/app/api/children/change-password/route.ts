import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcrypt";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const childId = body?.childId as string | undefined;
    const newPassword = body?.newPassword as string | undefined;

    if (!childId || !newPassword) {
      return NextResponse.json(
        { error: "Missing childId or password" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
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

    const password_hash = await bcrypt.hash(newPassword, 10);

    const { data, error } = await supabase
      .from("children")
      .update({ password_hash })
      .eq("id", childId)
      .eq("parent_id", parentData.parent_id)
      .select("id");

    if (error) {
      console.error("Error updating child password:", error);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Child not found for this parent" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error in change-password route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update password" },
      { status: 500 }
    );
  }
}

