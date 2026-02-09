"use server";

import { supabase } from "@/lib/supabaseClient";
import { getOrSetCache, invalidateCache } from "@/lib/redis";
import { FeedPost } from "./feed";
import { revalidatePath } from "next/cache";

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
  total_likes_received: number;
  total_comments_made: number;
  created_at: string;
  followers_count: number;
  following_count: number;
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

      // Fetch Followers Count
      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_child_id", data.child_id);

      // Fetch Following Count
      const { count: followingCount, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_child_id", data.child_id);

      return {
        ...data,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
      } as ChildProfile;
    },
    300 // 5 minutes
  );
}

export async function refreshChildProfile(username: string) {
  const cacheKey = `profile:${username}`;
  await invalidateCache(cacheKey);
  const profile = await getChildProfile(username);
  return profile;
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
