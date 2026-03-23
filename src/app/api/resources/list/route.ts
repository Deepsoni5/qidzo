import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getResourcesForStudent } from "@/actions/resources";
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

        if (bust) await invalidateCache(`student:resources:${childId}`);

        const resources = await getResourcesForStudent(childId);
        return NextResponse.json({ resources: resources || [] });
      } catch {
        // invalid token — fall through to public only
      }
    }

    // Not logged in — public only
    const cacheKey = "resources:public";
    if (bust) await invalidateCache(cacheKey);

    const resources = await getOrSetCache(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from("school_resources")
          .select("*, school:schools(name, logo_url, school_id)")
          .eq("is_private", false)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
      },
      60,
    );

    return NextResponse.json({ resources });
  } catch (err) {
    console.error("Resources list error:", err);
    return NextResponse.json({ resources: [] });
  }
}
