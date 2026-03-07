import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getChildSession } from "@/actions/auth";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

export async function POST() {
  try {
    const childSession = await getChildSession();

    if (!childSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = childSession.id as string;
    const userName = childSession.username as string;

    // Generate Stream Video token using jose (already in your dependencies)
    const secret = new TextEncoder().encode(apiSecret);

    const token = await new SignJWT({ user_id: userId })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    return NextResponse.json({
      token,
      apiKey,
      userId,
      userName,
    });
  } catch (error) {
    console.error("Video token error:", error);
    return NextResponse.json(
      { error: "Failed to generate video token" },
      { status: 500 },
    );
  }
}
