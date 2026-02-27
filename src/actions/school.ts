"use server";

export type SchoolSettingsInput = {
  name: string;
  contact_email: string;
  contact_phone: string;
  website_url?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  about: string;
  logo_url?: string;
  banner_url?: string;
  brand_primary_color?: string;
  brand_secondary_color?: string;
  grades_offered?: string[];
};

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { getOrSetCache } from "@/lib/redis";

export async function getSchoolDashboardData() {
  try {
    const user = await currentUser();
    if (!user) return null;

    // 1. Get school profile
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (schoolError || !school) return null;

    // Use Redis cache for dashboard data (5 minutes TTL)
    const cacheKey = `school:dashboard:${school.id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        // 2. Get Real Analytics

        // Followers and inquiries analytics use a 30-day lookback
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthISO = lastMonth.toISOString();

        // Base queries in parallel
        const [
          // Followers total and last month snapshot
          { count: totalFollowers },
          { count: followersLastMonth },
          // All posts for this school (used by multiple analytics)
          { data: allSchoolPosts },
          // Inquiries total and last month snapshot
          { count: admissionInquiries },
          { count: inquiriesLastMonth },
        ] = await Promise.all([
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_school_id", school.school_id),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_school_id", school.school_id)
            .lt("created_at", lastMonthISO),
          supabase
            .from("posts")
            .select("id, likes_count, comments_count, created_at, category_id")
            .eq("school_id", school.id),
          supabase
            .from("school_inquiries")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id),
          supabase
            .from("school_inquiries")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .lt("created_at", lastMonthISO),
        ]);

        // Aggregate engagement from posts
        const schoolPosts = allSchoolPosts || [];
        const postEngagement =
          schoolPosts.reduce(
            (sum: number, post: any) =>
              sum + (post.likes_count || 0) + (post.comments_count || 0),
            0,
          ) || 0;

        const postsLastMonth = schoolPosts.filter(
          (post: any) => post.created_at < lastMonthISO,
        );
        const engagementLastMonth =
          postsLastMonth.reduce(
            (sum: number, post: any) =>
              sum + (post.likes_count || 0) + (post.comments_count || 0),
            0,
          ) || 0;

        const totalPosts = schoolPosts.length;
        const postsLastMonthCount = postsLastMonth.length;

        const followerGrowth =
          followersLastMonth && followersLastMonth > 0
            ? Math.round(
                (((totalFollowers || 0) - followersLastMonth) /
                  Math.max(followersLastMonth, 1)) *
                  100,
              )
            : 0;

        const engagementGrowth =
          engagementLastMonth && engagementLastMonth > 0
            ? Math.round(
                ((postEngagement - engagementLastMonth) /
                  Math.max(engagementLastMonth, 1)) *
                  100,
              )
            : 0;

        const inquiryGrowth =
          inquiriesLastMonth && inquiriesLastMonth > 0
            ? Math.round(
                (((admissionInquiries || 0) - inquiriesLastMonth) /
                  Math.max(inquiriesLastMonth, 1)) *
                  100,
              )
            : 0;

        const participationGrowth =
          postsLastMonthCount && postsLastMonthCount > 0
            ? Math.round(
                (((totalPosts || 0) - postsLastMonthCount) /
                  Math.max(postsLastMonthCount, 1)) *
                  100,
              )
            : 0;

        const analytics = {
          totalFollowers: totalFollowers || 0,
          followerGrowth,
          postEngagement,
          engagementGrowth,
          admissionInquiries: admissionInquiries || 0,
          inquiryGrowth,
          examParticipation: totalPosts || 0,
          participationGrowth,
        };

        // 3. Activity Data (Last 7 days) — aggregate from single queries
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);

        const sevenDaysStartISO = new Date(
          sevenDaysAgo.setHours(0, 0, 0, 0),
        ).toISOString();

        // Preload likes/comments/inquiries/follows for last 7 days in parallel
        const [recentFollowers, recentLikes, recentComments, recentInquiriesForActivity] =
          await Promise.all([
            supabase
              .from("follows")
              .select("created_at")
              .eq("following_school_id", school.school_id)
              .gte("created_at", sevenDaysStartISO),
            supabase
              .from("likes")
              .select("post_id, created_at")
              .in(
                "post_id",
                schoolPosts.map((p: any) => p.id),
              )
              .gte("created_at", sevenDaysStartISO),
            supabase
              .from("comments")
              .select("post_id, created_at")
              .in(
                "post_id",
                schoolPosts.map((p: any) => p.id),
              )
              .gte("created_at", sevenDaysStartISO),
            supabase
              .from("school_inquiries")
              .select("created_at")
              .eq("school_id", school.id)
              .gte("created_at", sevenDaysStartISO),
          ]);

        const followersArr = recentFollowers?.data || [];
        const likesArr = recentLikes?.data || [];
        const commentsArr = recentComments?.data || [];
        const inquiriesArr = recentInquiriesForActivity?.data || [];

        const activityData: any[] = [];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        for (let i = 6; i >= 0; i--) {
          const day = new Date();
          day.setDate(day.getDate() - i);
          const dayStart = new Date(day.setHours(0, 0, 0, 0));
          const dayEnd = new Date(day.setHours(23, 59, 59, 999));

          const dayFollowers =
            followersArr.filter((f: any) => {
              const created = new Date(f.created_at);
              return created >= dayStart && created <= dayEnd;
            }).length || 0;

          const dayLikes =
            likesArr.filter((l: any) => {
              const created = new Date(l.created_at);
              return created >= dayStart && created <= dayEnd;
            }).length || 0;

          const dayComments =
            commentsArr.filter((c: any) => {
              const created = new Date(c.created_at);
              return created >= dayStart && created <= dayEnd;
            }).length || 0;

          const dayInquiries =
            inquiriesArr.filter((inq: any) => {
              const created = new Date(inq.created_at);
              return created >= dayStart && created <= dayEnd;
            }).length || 0;

          activityData.push({
            name: days[dayStart.getDay()],
            followers: dayFollowers,
            engagement: dayLikes + dayComments,
            inquiries: dayInquiries,
          });
        }

        // 4. Category Distribution (from posts)
        const { data: postsWithCategories } = await supabase
          .from("posts")
          .select(
            `
            category_id,
            category:categories(name)
          `,
          )
          .eq("school_id", school.id);

        const categoryMap: Record<string, number> = {};
        postsWithCategories?.forEach((post: any) => {
          const catName = post.category?.name || "Uncategorized";
          categoryMap[catName] = (categoryMap[catName] || 0) + 1;
        });

        const total =
          Object.values(categoryMap).reduce((sum, count) => sum + count, 0) ||
          1;
        const colors = ["#0EA5E9", "#10B981", "#FBBF24", "#EC4899", "#8B5CF6"];

        const categoryData = Object.entries(categoryMap)
          .map(([name, count], index) => ({
            name,
            value: Math.round((count / total) * 100),
            color: colors[index % colors.length],
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5 categories

        // 5. Recent Inquiries (last 3)
        const { data: recentInquiries } = await supabase
          .from("school_inquiries")
          .select("inquiry_id, name, subject, created_at, status, is_read")
          .eq("school_id", school.id)
          .order("created_at", { ascending: false })
          .limit(3);

        return {
          school,
          analytics,
          activityData,
          categoryData,
          recentInquiries: recentInquiries || [],
        };
      },
      300, // 5 minutes cache
    );
  } catch (error) {
    console.error("Error in getSchoolDashboardData:", error);
    return null;
  }
}

export async function getSchoolProfile() {
  try {
    const user = await currentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error("Error in getSchoolProfile:", error);
    return null;
  }
}

export async function updateSchoolSettings(
  input: SchoolSettingsInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not authenticated." };

    const { error } = await supabase
      .from("schools")
      .update({
        name: input.name,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone,
        website_url: input.website_url || null,
        address_line1: input.address_line1,
        address_line2: input.address_line2 || null,
        city: input.city,
        state: input.state,
        country: input.country,
        postal_code: input.postal_code,
        about: input.about,
        logo_url: input.logo_url || null,
        banner_url: input.banner_url || null,
        brand_primary_color: input.brand_primary_color || null,
        brand_secondary_color: input.brand_secondary_color || null,
        grades_offered: input.grades_offered || [],
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateSchoolSettings:", error);
    return { success: false, error: "Unexpected error. Please try again." };
  }
}

// ─── Gallery Types ────────────────────────────────────────────────────────────
export type GalleryItemInput = {
  media_url: string;
  media_type: "IMAGE" | "VIDEO";
  title?: string;
  description?: string;
  tags?: string[];
  event_date?: string;
};

export type GalleryItem = {
  id: string;
  school_id: string;
  media_url: string;
  media_type: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  event_date: string | null;
  is_active: boolean;
  created_at: string;
};

// ─── Get gallery items for the logged-in school ───────────────────────────────
export async function getSchoolGallery(): Promise<GalleryItem[]> {
  try {
    const user = await currentUser();
    if (!user) return [];

    const { data: school } = await supabase
      .from("schools")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!school) return [];

    const { data, error } = await supabase
      .from("school_gallery")
      .select("*")
      .eq("school_id", school.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching gallery:", error);
      return [];
    }
    return (data as GalleryItem[]) || [];
  } catch (error) {
    console.error("Error in getSchoolGallery:", error);
    return [];
  }
}

// ─── Add a gallery item ───────────────────────────────────────────────────────
export async function addGalleryItem(
  input: GalleryItemInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not authenticated." };

    const { data: school } = await supabase
      .from("schools")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!school) return { success: false, error: "School not found." };

    const { error } = await supabase.from("school_gallery").insert({
      school_id: school.id,
      media_url: input.media_url,
      media_type: input.media_type,
      title: input.title || null,
      description: input.description || null,
      tags: input.tags && input.tags.length > 0 ? input.tags : null,
      event_date: input.event_date || null,
      is_active: true,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    console.error("Error in addGalleryItem:", error);
    return { success: false, error: "Unexpected error. Please try again." };
  }
}

// ─── Soft-delete a gallery item ───────────────────────────────────────────────
export async function deleteGalleryItem(
  itemId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not authenticated." };

    const { data: school } = await supabase
      .from("schools")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!school) return { success: false, error: "School not found." };

    const { error } = await supabase
      .from("school_gallery")
      .update({ is_active: false })
      .eq("id", itemId)
      .eq("school_id", school.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteGalleryItem:", error);
    return { success: false, error: "Unexpected error. Please try again." };
  }
}

export interface School {
  id: string;
  school_id: string;
  clerk_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  about: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  grades_offered: any;
  is_verified: boolean;
  is_active: boolean;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_starts_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolProfile extends School {
  followers_count: number;
  following_count: number;
}

export async function getSchoolBySlug(
  slug: string,
): Promise<SchoolProfile | null> {
  try {
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;

    // Fetch Followers Count
    const { count: followersCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_school_id", data.id);

    // Fetch Following Count
    const { count: followingCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_school_id", data.id);

    return {
      ...data,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
    } as SchoolProfile;
  } catch (error) {
    console.error("Error in getSchoolBySlug:", error);
    return null;
  }
}

export async function getSchoolPosts(schoolId: string) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        schools!posts_school_id_fkey (
          id,
          school_id,
          name,
          slug,
          logo_url,
          brand_primary_color
        ),
        category:categories (
          name,
          color,
          icon
        )
      `,
      )
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching school posts:", error);
      return [];
    }

    // Map school data properly
    return (data || []).map((post: any) => ({
      ...post,
      school: post.schools, // Rename schools to school for consistency
      child: {
        name: post.schools?.name,
        username: post.schools?.slug,
        avatar: post.schools?.logo_url,
        // schools don't have these, but PostCard expects them or handles missing
        age: 0,
        level: 1,
      },
    }));
  } catch (error) {
    console.error("Error in getSchoolPosts:", error);
    return [];
  }
}

// ─── Public: get gallery for a school by school id ────────────────────────────
export async function getSchoolGalleryBySchoolId(
  schoolId: string,
): Promise<GalleryItem[]> {
  try {
    const { data, error } = await supabase
      .from("school_gallery")
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    return (data as GalleryItem[]) || [];
  } catch {
    return [];
  }
}
