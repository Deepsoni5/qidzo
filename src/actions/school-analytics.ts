"use server";

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { getOrSetCache } from "@/lib/redis";

export async function getSchoolAnalytics() {
  try {
    const user = await currentUser();
    if (!user) return null;

    const { data: school } = await supabase
      .from("schools")
      .select("*")
      .eq("clerk_id", user.id)
      .single();

    if (!school) return null;

    const cacheKey = `school:analytics:${school.id}`;

    return getOrSetCache(
      cacheKey,
      async () => {
        // 1. Followers Analytics
        const { data: allFollowers } = await supabase
          .from("follows")
          .select("follower_type, created_at")
          .eq("following_school_id", school.school_id)
          .order("created_at", { ascending: true });

        const childFollowers =
          allFollowers?.filter((f) => f.follower_type === "CHILD").length || 0;
        const parentFollowers =
          allFollowers?.filter((f) => f.follower_type === "PARENT").length || 0;
        const totalFollowers = childFollowers + parentFollowers;

        // Followers over time (last 30 days)
        const followersOverTime = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));

          const followersUpToDate =
            allFollowers?.filter((f) => new Date(f.created_at) <= dayStart)
              .length || 0;

          followersOverTime.push({
            date: dayStart.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            total: followersUpToDate,
            children:
              allFollowers?.filter(
                (f) =>
                  new Date(f.created_at) <= dayStart &&
                  f.follower_type === "CHILD",
              ).length || 0,
            parents:
              allFollowers?.filter(
                (f) =>
                  new Date(f.created_at) <= dayStart &&
                  f.follower_type === "PARENT",
              ).length || 0,
          });
        }

        // 2. Posts Analytics
        const { data: allPosts } = await supabase
          .from("posts")
          .select(
            "id, likes_count, comments_count, created_at, category_id, category:categories(name)",
          )
          .eq("school_id", school.id);

        const totalPosts = allPosts?.length || 0;
        const totalLikes =
          allPosts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
        const totalComments =
          allPosts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
        const avgEngagement =
          totalPosts > 0
            ? Math.round((totalLikes + totalComments) / totalPosts)
            : 0;

        // Posts over time (last 30 days)
        const postsOverTime = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
          const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

          const dayPosts =
            allPosts?.filter(
              (p) => p.created_at >= dayStart && p.created_at <= dayEnd,
            ) || [];

          postsOverTime.push({
            date: new Date(dayStart).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            posts: dayPosts.length,
            likes: dayPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
            comments: dayPosts.reduce(
              (sum, p) => sum + (p.comments_count || 0),
              0,
            ),
          });
        }

        // Category breakdown
        const categoryMap: Record<
          string,
          { posts: number; likes: number; comments: number }
        > = {};
        allPosts?.forEach((post: any) => {
          const catName = post.category?.name || "Uncategorized";
          if (!categoryMap[catName]) {
            categoryMap[catName] = { posts: 0, likes: 0, comments: 0 };
          }
          categoryMap[catName].posts++;
          categoryMap[catName].likes += post.likes_count || 0;
          categoryMap[catName].comments += post.comments_count || 0;
        });

        const categoryBreakdown = Object.entries(categoryMap)
          .map(([name, stats]) => ({
            name,
            ...stats,
            engagement: stats.likes + stats.comments,
          }))
          .sort((a, b) => b.engagement - a.engagement);

        // 3. Inquiries Analytics
        const { data: allInquiries } = await supabase
          .from("school_inquiries")
          .select("status, user_type, subject, created_at")
          .eq("school_id", school.id);

        const totalInquiries = allInquiries?.length || 0;
        const pendingInquiries =
          allInquiries?.filter((i) => i.status === "PENDING").length || 0;
        const repliedInquiries =
          allInquiries?.filter((i) => i.status === "REPLIED").length || 0;
        const closedInquiries =
          allInquiries?.filter((i) => i.status === "CLOSED").length || 0;

        const childInquiries =
          allInquiries?.filter((i) => i.user_type === "CHILD").length || 0;
        const parentInquiries =
          allInquiries?.filter((i) => i.user_type === "PARENT").length || 0;

        // Inquiries over time (last 30 days)
        const inquiriesOverTime = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
          const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

          const dayInquiries =
            allInquiries?.filter(
              (inq) => inq.created_at >= dayStart && inq.created_at <= dayEnd,
            ) || [];

          inquiriesOverTime.push({
            date: new Date(dayStart).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            total: dayInquiries.length,
            children: dayInquiries.filter((i) => i.user_type === "CHILD")
              .length,
            parents: dayInquiries.filter((i) => i.user_type === "PARENT")
              .length,
          });
        }

        // Subject breakdown
        const subjectMap: Record<string, number> = {};
        allInquiries?.forEach((inq: any) => {
          subjectMap[inq.subject] = (subjectMap[inq.subject] || 0) + 1;
        });

        const subjectBreakdown = Object.entries(subjectMap)
          .map(([subject, count]) => ({ subject, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // 4. Engagement Analytics
        const { data: allLikes } = await supabase
          .from("likes")
          .select("liker_type, created_at")
          .in("post_id", allPosts?.map((p) => p.id) || []);

        const { data: allComments } = await supabase
          .from("comments")
          .select("user_type, created_at")
          .in("post_id", allPosts?.map((p) => p.id) || []);

        const likesFromChildren =
          allLikes?.filter((l) => l.liker_type === "CHILD").length || 0;
        const likesFromParents =
          allLikes?.filter((l) => l.liker_type === "PARENT").length || 0;
        const commentsFromChildren =
          allComments?.filter((c) => c.user_type === "CHILD").length || 0;
        const commentsFromSchools =
          allComments?.filter((c) => c.user_type === "SCHOOL").length || 0;

        return {
          school,
          followers: {
            total: totalFollowers,
            children: childFollowers,
            parents: parentFollowers,
            overTime: followersOverTime,
          },
          posts: {
            total: totalPosts,
            totalLikes,
            totalComments,
            avgEngagement,
            overTime: postsOverTime,
            byCategory: categoryBreakdown,
          },
          inquiries: {
            total: totalInquiries,
            pending: pendingInquiries,
            replied: repliedInquiries,
            closed: closedInquiries,
            fromChildren: childInquiries,
            fromParents: parentInquiries,
            overTime: inquiriesOverTime,
            bySubject: subjectBreakdown,
          },
          engagement: {
            likesFromChildren,
            likesFromParents,
            commentsFromChildren,
            commentsFromSchools,
          },
        };
      },
      600, // 10 minutes cache
    );
  } catch (error) {
    console.error("Error in getSchoolAnalytics:", error);
    return null;
  }
}
