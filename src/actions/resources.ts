"use server";

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { getOrSetCache, invalidateCache } from "@/lib/redis";

function generateResourceId() {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `RES${rand}`;
}

async function getSchoolForUser() {
  const user = await currentUser();
  if (!user) return null;
  const { data } = await supabase
    .from("schools")
    .select("id, school_id, name, logo_url")
    .eq("clerk_id", user.id)
    .single();
  return data;
}

export async function createResource(input: {
  title: string;
  description?: string;
  subject?: string;
  type: "video" | "image" | "pdf";
  file_url: string;
  thumbnail_url?: string;
  is_private: boolean;
}) {
  const school = await getSchoolForUser();
  if (!school) return { error: "School not found" };

  let resource_id = generateResourceId();
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from("school_resources")
      .select("resource_id")
      .eq("resource_id", resource_id)
      .single();
    if (!data) break;
    resource_id = generateResourceId();
  }

  const { data, error } = await supabase
    .from("school_resources")
    .insert({
      resource_id,
      school_id: school.id,
      title: input.title,
      description: input.description || null,
      subject: input.subject || null,
      type: input.type,
      file_url: input.file_url,
      thumbnail_url: input.thumbnail_url || null,
      is_private: input.is_private,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await invalidateCache(`school:resources:${school.id}`);
  return { data };
}

export async function getSchoolResources() {
  const school = await getSchoolForUser();
  if (!school) return null;

  const cacheKey = `school:resources:${school.id}`;
  return getOrSetCache(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from("school_resources")
        .select("*")
        .eq("school_id", school.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    60,
  );
}

export async function deleteResource(resourceId: string) {
  const school = await getSchoolForUser();
  if (!school) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("school_resources")
    .delete()
    .eq("resource_id", resourceId)
    .eq("school_id", school.id);

  if (error) return { error: error.message };

  await invalidateCache(`school:resources:${school.id}`);
  return { success: true };
}

// Student-facing: public + own school's private resources
export async function getResourcesForStudent(childId: string) {
  const cacheKey = `student:resources:${childId}`;
  return getOrSetCache(
    cacheKey,
    async () => {
      const { data: child } = await supabase
        .from("children")
        .select("parent_id")
        .eq("child_id", childId)
        .single();

      const schoolId = child?.parent_id?.startsWith("SP_")
        ? child.parent_id.slice(3)
        : null;

      let schoolUuid: string | null = null;
      if (schoolId) {
        const { data: school } = await supabase
          .from("schools")
          .select("id")
          .eq("school_id", schoolId)
          .single();
        schoolUuid = school?.id ?? null;
      }

      const { data, error } = await supabase
        .from("school_resources")
        .select("*, school:schools(name, logo_url, school_id)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).filter((r: any) => {
        if (!r.is_private) return true;
        if (schoolUuid && r.school_id === schoolUuid) return true;
        return false;
      });
    },
    60,
  );
}
