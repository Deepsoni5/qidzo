"use server";

import { supabase } from "@/lib/supabaseClient";
import { redis } from "@/lib/redis";

export interface FeedPost {
  id: string;
  post_id: string;
  child_id: string;
  category_id: string;
  title: string | null;
  content: string;
  media_type: "IMAGE" | "VIDEO" | "NONE";
  media_url: string | null;
  media_thumbnail: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  child: {
    name: string;
    username: string;
    avatar: string | null;
    age: number;
    level: number;
  };
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

export async function getFeedPosts(page: number = 1, limit: number = 10, categoryIds: string[] = []) {
  const offset = (page - 1) * limit;
  // Create a unique cache key that includes sorted category IDs
  const categoriesKey = categoryIds.length > 0 ? `:cats:${categoryIds.sort().join(',')}` : '';
  const cacheKey = `feed:posts:${page}:${limit}${categoriesKey}`;

  try {
    // 1. Try fetching from Redis cache
    const cachedData = await redis.get<FeedPost[]>(cacheKey);
    if (cachedData) {
      // console.log(`Returning cached feed for page ${page}`);
      return cachedData;
    }

    // 2. Fetch from Supabase if cache miss
    let query = supabase
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
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply category filter if provided
    if (categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching feed posts:", error);
      throw new Error("Failed to fetch posts");
    }

    const posts = data as unknown as FeedPost[];

    // 3. Cache the result in Redis (expire in 60 seconds)
    await redis.set(cacheKey, posts, { ex: 60 });

    return posts;
  } catch (error) {
    console.error("Feed fetch error:", error);
    return [];
  }
}
