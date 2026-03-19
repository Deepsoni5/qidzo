import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://qidzo.com"; // Always non-www — make sure www redirects here
  const currentDate = new Date();

  // ─── Static Pages ────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/playzone`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/schools`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // ─── School Pages ─────────────────────────────────────────────────────────────
  // Only include: active schools + real slugs (exclude test/dummy entries)
  let schoolPages: MetadataRoute.Sitemap = [];
  try {
    const { data: schools, error } = await supabase
      .from("schools")
      .select("slug, updated_at, name")
      .eq("is_active", true)
      .not("slug", "is", null)
      .not("slug", "eq", "new-school") // exclude dummy/test entries
      .not("slug", "eq", "abc-international-school") // exclude dummy/test entries
      .limit(1000);

    if (error) throw error;

    if (schools && schools.length > 0) {
      console.log(`Sitemap: Found ${schools.length} active schools`);
      schoolPages = schools.map((school) => ({
        url: `${baseUrl}/schools/${school.slug}`,
        lastModified: new Date(school.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Sitemap: Error fetching schools:", error);
  }

  return [...staticPages, ...schoolPages];
}
