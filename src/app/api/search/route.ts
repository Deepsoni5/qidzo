import { NextResponse } from "next/server";
import { globalSearch } from "@/actions/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = await globalSearch(q);
  return NextResponse.json({ results });
}

