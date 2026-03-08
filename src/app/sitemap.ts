import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://qidzo.com";
  const currentDate = new Date();

  // Static pages with high priority
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

  // Fetch active schools for public pages
  let schoolPages: MetadataRoute.Sitemap = [];
  try {
    const { data: schools } = await supabase
      .from("schools")
      .select("slug, updated_at")
      .eq("is_active", true)
      .not("slug", "is", null)
      .limit(1000);

    if (schools && schools.length > 0) {
      console.log(`Sitemap: Found ${schools.length} schools`);
      schoolPages = schools.map((school) => ({
        url: `${baseUrl}/schools/${school.slug}`,
        lastModified: new Date(school.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } else {
      console.log("Sitemap: No schools found");
    }
  } catch (error) {
    console.error("Error fetching schools for sitemap:", error);
  }

  // Fetch active children profiles (public profiles only)
  let childPages: MetadataRoute.Sitemap = [];
  try {
    const { data: children } = await supabase
      .from("children")
      .select("username, updated_at")
      .not("username", "is", null)
      .limit(5000); // Limit to prevent huge sitemaps

    if (children && children.length > 0) {
      childPages = children.map((child) => ({
        url: `${baseUrl}/child/${child.username}`,
        lastModified: new Date(child.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("Error fetching children for sitemap:", error);
  }

  // Combine all pages
  return [...staticPages, ...schoolPages, ...childPages];
}
