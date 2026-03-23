import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export async function POST(req: NextRequest) {
  try {
    const { channelName, uid, role } = await req.json();

    if (!channelName || uid === undefined) {
      return NextResponse.json(
        { error: "Missing channelName or uid" },
        { status: 400 },
      );
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: "Agora credentials not configured" },
        { status: 500 },
      );
    }

    // Token expires in 4 hours
    const expirationTimeInSeconds = 4 * 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const agoraRole = role === "host" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    return NextResponse.json({ token, appId });
  } catch (err: any) {
    console.error("Agora token error:", err);
    return NextResponse.json(
      { error: "Token generation failed" },
      { status: 500 },
    );
  }
}
