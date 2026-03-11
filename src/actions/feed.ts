"use server";

import { supabase } from "@/lib/supabaseClient";
import { redis } from "@/lib/redis";
import { getChildSession } from "./auth";
import { currentUser } from "@clerk/nextjs/server";

export interface FeedPost {
  id: string;
  post_id: string;
  child_id: string;
  school_id?: string;
  publisher_type?: "CHILD" | "SCHOOL";
  category_id: string;
  title: string | null;
  content: string;
  media_type: "IMAGE" | "VIDEO" | "DOCUMENT" | "NONE";
  media_url: string | null;
  media_thumbnail: string | null;
  file_name?: string | null;
  file_size?: number | null;
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
    country?: string | null;
  };
  school?: {
    id: string;
    school_id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    brand_primary_color?: string;
    city?: string | null;
    country?: string | null;
  };
  category: {
    name: string;
    color: string;
    icon: string;
  };
  // These are per-viewer flags and are computed on the server per request.
  // They are NOT stored in Redis cache and are always optional.
  isLikedByViewer?: boolean;
  isViewerFollowingAuthor?: boolean;
}

export async function getFeedPosts(
  page: number = 1,
  limit: number = 10,
  categoryIds: string[] = [],
) {
  const offset = (page - 1) * limit;
  // Create a unique cache key that includes sorted category IDs
  const categoriesKey =
    categoryIds.length > 0 ? `:cats:${categoryIds.sort().join(",")}` : "";
  const cacheKey = `feed:posts:${page}:${limit}${categoriesKey}`;

  try {
    // 1. Try fetching from Redis cache
    const cachedData = await redis.get<FeedPost[]>(cacheKey);

    // Helper to attach per-viewer state (likes / follows) without affecting cache
    const attachViewerState = async (
      basePosts: FeedPost[],
    ): Promise<FeedPost[]> => {
      if (!basePosts.length) return basePosts;

      // Determine current viewer (child, parent, or school)
      let viewerChildId: string | null = null;
      let viewerParentId: string | null = null;
      let viewerSchoolId: string | null = null;

      const childSession = await getChildSession();
      if (childSession) {
        viewerChildId = childSession.id as string;
      } else {
        const user = await currentUser();
        if (user) {
          // Try parent first
          const { data: parentData } = await supabase
            .from("parents")
            .select("parent_id")
            .eq("clerk_id", user.id)
            .single();

          if (parentData) {
            viewerParentId = parentData.parent_id;
          } else {
            const { data: schoolData } = await supabase
              .from("schools")
              .select("school_id")
              .eq("clerk_id", user.id)
              .single();

            if (schoolData) {
              viewerSchoolId = schoolData.school_id;
            }
          }
        }
      }

      // If no logged-in viewer, just return posts as-is
      if (!viewerChildId && !viewerParentId && !viewerSchoolId) {
        return basePosts;
      }

      const postIds = basePosts.map((p) => p.post_id);

      // 1) Likes for all posts by current viewer (single query)
      let likedPostIds = new Set<string>();
      {
        let likesQuery = supabase
          .from("likes")
          .select("post_id")
          .in("post_id", postIds);

        if (viewerChildId) {
          likesQuery = likesQuery.eq("child_id", viewerChildId);
        } else if (viewerParentId) {
          likesQuery = likesQuery.eq("parent_id", viewerParentId);
        } else if (viewerSchoolId) {
          likesQuery = likesQuery.eq("school_id", viewerSchoolId);
        }

        const { data: likesData, error: likesError } = await likesQuery;
        if (!likesError && likesData) {
          likedPostIds = new Set(
            likesData.map((l: any) => l.post_id as string),
          );
        }
      }

      // 2) Follow status for authors (children and schools) by current viewer
      const childAuthorIds = Array.from(
        new Set(
          basePosts
            .filter((p) => p.child_id && p.publisher_type !== "SCHOOL")
            .map((p) => p.child_id),
        ),
      );

      const schoolAuthorIds = Array.from(
        new Set(
          basePosts
            .filter((p) => p.school?.school_id)
            .map((p) => p.school!.school_id),
        ),
      );

      const followingChildIds = new Set<string>();
      const followingSchoolIds = new Set<string>();

      // Follow CHILD targets
      if (childAuthorIds.length) {
        let followsQuery = supabase
          .from("follows")
          .select("following_child_id");

        if (viewerChildId) {
          followsQuery = followsQuery.eq("follower_child_id", viewerChildId);
        } else if (viewerParentId) {
          followsQuery = followsQuery.eq("follower_parent_id", viewerParentId);
        } else if (viewerSchoolId) {
          followsQuery = followsQuery.eq("follower_school_id", viewerSchoolId);
        }

        followsQuery = followsQuery.in("following_child_id", childAuthorIds);

        const { data: followsData, error: followsError } = await followsQuery;
        if (!followsError && followsData) {
          for (const row of followsData as any[]) {
            if (row.following_child_id) {
              followingChildIds.add(row.following_child_id as string);
            }
          }
        }
      }

      // Follow SCHOOL targets
      if (schoolAuthorIds.length) {
        let followsQuery = supabase
          .from("follows")
          .select("following_school_id");

        if (viewerChildId) {
          followsQuery = followsQuery.eq("follower_child_id", viewerChildId);
        } else if (viewerParentId) {
          followsQuery = followsQuery.eq("follower_parent_id", viewerParentId);
        } else if (viewerSchoolId) {
          followsQuery = followsQuery.eq("follower_school_id", viewerSchoolId);
        }

        followsQuery = followsQuery.in("following_school_id", schoolAuthorIds);

        const { data: followsData, error: followsError } = await followsQuery;
        if (!followsError && followsData) {
          for (const row of followsData as any[]) {
            if (row.following_school_id) {
              followingSchoolIds.add(row.following_school_id as string);
            }
          }
        }
      }

      // Attach viewer flags per post
      return basePosts.map((post) => {
        const isSchoolPost =
          post.publisher_type === "SCHOOL" || !!post.school_id || !!post.school;
        const authorSchoolId = post.school?.school_id;
        const authorChildId = post.child_id;

        const isFollowingAuthor = isSchoolPost
          ? !!(authorSchoolId && followingSchoolIds.has(authorSchoolId))
          : !!(authorChildId && followingChildIds.has(authorChildId));

        return {
          ...post,
          isLikedByViewer: likedPostIds.has(post.post_id),
          isViewerFollowingAuthor: isFollowingAuthor,
        };
      });
    };

    if (cachedData) {
      // Attach per-viewer flags on top of cached base posts
      return attachViewerState(cachedData);
    }

    // 2. Fetch from Supabase if cache miss
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        child:children (
          name,
          username,
          avatar,
          age,
          level,
          country
        ),
        schools!posts_school_id_fkey (
          id,
          school_id,
          name,
          slug,
          logo_url,
          brand_primary_color,
          city,
          country
        ),
        category:categories (
          name,
          color,
          icon
        )
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply category filter if provided
    if (categoryIds.length > 0) {
      query = query.in("category_id", categoryIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching feed posts:", error);
      throw new Error("Failed to fetch posts");
    }

    // Map schools field to school for consistency
    const basePosts = (data || []).map((post: any) => ({
      ...post,
      school: post.schools, // Rename schools to school
    })) as unknown as FeedPost[];

    // 3. Cache the base result in Redis (expire in 5 minutes for better performance)
    await redis.set(cacheKey, basePosts, { ex: 300 });

    // 4. Attach per-viewer flags before returning
    return attachViewerState(basePosts);
  } catch (error) {
    console.error("Feed fetch error:", error);
    return [];
  }
}
