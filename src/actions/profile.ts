"use server";

import { supabase } from "@/lib/supabaseClient";
import { getOrSetCache } from "@/lib/redis";
import { FeedPost } from "./feed";

export interface ChildProfile {
  id: string;
  child_id: string;
  name: string;
  username: string;
  avatar: string | null;
  age: number;
  level: number;
  xp_points: number;
  total_posts: number;
  created_at: string;
}

export async function getChildProfile(username: string) {
  const cacheKey = `profile:${username}`;

  return getOrSetCache<ChildProfile | null>(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("username", username)
        .single();

      if (error) {
        console.error("Error fetching child profile:", error);
        return null;
      }

      return data as ChildProfile;
    },
    300 // 5 minutes
  );
}

export async function getChildPosts(childId: string) {
  const cacheKey = `profile:posts:${childId}`;

  return getOrSetCache<FeedPost[]>(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          child:children (
            name,
            username,
            avatar,
            age,
            level
          ),
          category:categories (
            name,
            color,
            icon
          )
        `)
        .eq("child_id", childId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching child posts:", error);
        return [];
      }

      return data as unknown as FeedPost[];
    },
    60 // 1 minute
  );
}
