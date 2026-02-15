"use server";

import { supabase } from "@/lib/supabaseClient";

export interface SearchChildResult {
  type: "child";
  id: string;
  child_id: string;
  name: string;
  username: string;
  age: number | null;
  avatar: string | null;
  xp_points: number;
  level: number;
  total_posts: number;
}

export interface SearchPostResult {
  type: "post";
  id: string;
  post_id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  child?: {
    name: string;
    username: string;
    avatar: string | null;
  } | null;
}

export type GlobalSearchResult = SearchChildResult | SearchPostResult;

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const ilikePattern = `%${q}%`;

  const [childrenRes, postsRes] = await Promise.all([
    supabase
      .from("children")
      .select("id, child_id, name, username, age, avatar, xp_points, level, total_posts")
      .or(`name.ilike.${ilikePattern},username.ilike.${ilikePattern}`)
      .eq("is_active", true)
      .limit(10),
    supabase
      .from("posts")
      .select(
        `id, post_id, title, content, created_at, likes_count, comments_count,
         child:children (name, username, avatar)`
      )
      .or(`title.ilike.${ilikePattern},content.ilike.${ilikePattern}`)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const children: SearchChildResult[] =
    (childrenRes.data || []).map((c: any) => ({
      type: "child",
      id: c.id,
      child_id: c.child_id,
      name: c.name,
      username: c.username,
      age: c.age,
      avatar: c.avatar,
      xp_points: c.xp_points,
      level: c.level,
      total_posts: c.total_posts,
    })) || [];

  const posts: SearchPostResult[] =
    (postsRes.data || []).map((p: any) => ({
      type: "post",
      id: p.id,
      post_id: p.post_id,
      title: p.title,
      content: p.content,
      created_at: p.created_at,
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      child: p.child
        ? {
            name: p.child.name,
            username: p.child.username,
            avatar: p.child.avatar,
          }
        : null,
    })) || [];

  return [...children, ...posts] as GlobalSearchResult[];
}

