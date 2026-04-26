import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getLiveStreamsForStudent } from "@/actions/live-classes";
import { supabase } from "@/lib/supabaseClient";
import { getOrSetCache, invalidateCache } from "@/lib/redis";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_please_change_in_production",
);

export async function GET(req: NextRequest) {
  try {
    const bust = req.nextUrl.searchParams.get("bust") === "1";
    const token = req.cookies.get("qidzo_child_token")?.value;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const childId = payload.id as string;

        if (bust) {
          // Bypass cache — invalidate and re-fetch fresh
          await invalidateCache(`student:live_streams:${childId}`);
        }

        const streams = await getLiveStreamsForStudent(childId);
        return NextResponse.json({ streams: streams || [] });
      } catch {
        // invalid token — fall through to public only
      }
    }

    // Not logged in or invalid token — return only public streams
    const cacheKey = "live_streams:public";

    if (bust) {
      await invalidateCache(cacheKey);
    }

    const streams = await getOrSetCache(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from("live_classes")
          .select("*, school:schools(name, logo_url, school_id)")
          .eq("is_private", false)
          .eq("class", "All")
          .in("status", ["live", "scheduled"])
          .order("status", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      },
      60,
    );

    return NextResponse.json({ streams });
  } catch (err) {
    console.error("Live streams error:", err);
    return NextResponse.json({ streams: [] });
  }
}
