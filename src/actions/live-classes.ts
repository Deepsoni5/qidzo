"use server";

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { getOrSetCache, invalidateCache } from "@/lib/redis";

function generateClassId() {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `LC${rand}`;
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

export async function createLiveClass(input: {
  title: string;
  subject?: string;
  description?: string;
  scheduled_at?: string;
  is_private: boolean;
}) {
  const school = await getSchoolForUser();
  if (!school) return { error: "School not found" };

  let class_id = generateClassId();
  // ensure uniqueness
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from("live_classes")
      .select("class_id")
      .eq("class_id", class_id)
      .single();
    if (!data) break;
    class_id = generateClassId();
  }

  const channel_name = `live_${class_id}`;

  const { data, error } = await supabase
    .from("live_classes")
    .insert({
      class_id,
      school_id: school.school_id,
      school_uuid: school.id,
      title: input.title,
      subject: input.subject || null,
      description: input.description || null,
      scheduled_at: input.scheduled_at || null,
      is_private: input.is_private,
      channel_name,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await invalidateCache(`school:live_classes:${school.id}`);
  return { data };
}

export async function startLiveClass(classId: string) {
  const school = await getSchoolForUser();
  if (!school) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("live_classes")
    .update({ status: "live", started_at: new Date().toISOString() })
    .eq("class_id", classId)
    .eq("school_uuid", school.id)
    .select()
    .single();

  if (error) return { error: error.message };
  await invalidateCache(`school:live_classes:${school.id}`);
  return { data };
}

export async function endLiveClass(classId: string) {
  const school = await getSchoolForUser();
  if (!school) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("live_classes")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("class_id", classId)
    .eq("school_uuid", school.id)
    .select()
    .single();

  if (error) return { error: error.message };
  await invalidateCache(`school:live_classes:${school.id}`);
  return { data };
}

export async function deleteLiveClass(classId: string) {
  const school = await getSchoolForUser();
  if (!school) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("live_classes")
    .delete()
    .eq("class_id", classId)
    .eq("school_uuid", school.id)
    .eq("status", "scheduled"); // only delete scheduled ones

  if (error) return { error: error.message };
  await invalidateCache(`school:live_classes:${school.id}`);
  return { success: true };
}

export async function getSchoolLiveClasses() {
  const school = await getSchoolForUser();
  if (!school) return null;

  const cacheKey = `school:live_classes:${school.id}`;
  return getOrSetCache(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from("live_classes")
        .select("*, attendees:live_class_attendees(count)")
        .eq("school_uuid", school.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Flatten attendee count
      return (data || []).map((cls: any) => ({
        ...cls,
        attendee_count: cls.attendees?.[0]?.count ?? 0,
        attendees: undefined,
      }));
    },
    60,
  );
}

export async function getClassAttendees(classId: string) {
  const school = await getSchoolForUser();
  if (!school) return null;

  const { data, error } = await supabase
    .from("live_class_attendees")
    .select("child_id, agora_uid, joined_at")
    .eq("class_id", classId)
    .order("joined_at", { ascending: true });

  if (error) return null;

  // Fetch usernames from children table for display
  const childIds = (data || []).map((r: any) => r.child_id).filter(Boolean);
  let nameMap: Record<string, string> = {};
  if (childIds.length > 0) {
    const { data: children } = await supabase
      .from("children")
      .select("child_id, username")
      .in("child_id", childIds);
    (children || []).forEach((c: any) => {
      nameMap[c.child_id] = c.username;
    });
  }

  return (data || []).map((r: any) => ({
    ...r,
    username: nameMap[r.child_id] ?? r.child_id,
  }));
}

export async function getLiveClassByChannel(channelName: string) {
  const { data, error } = await supabase
    .from("live_classes")
    .select("*, school:schools(name, logo_url, school_id)")
    .eq("channel_name", channelName)
    .single();
  if (error) return null;
  return data;
}

export async function getLiveClassById(classId: string) {
  const { data, error } = await supabase
    .from("live_classes")
    .select("*, school:schools(name, logo_url, school_id)")
    .eq("class_id", classId)
    .single();
  if (error) return null;
  return data;
}

// Fetches streams visible to a student:
// - All public streams (is_private = false)
// - Private streams only from the student's own school (matched via parent_id = SP_${school_id})
export async function getLiveStreamsForStudent(childId: string) {
  const cacheKey = `student:live_streams:${childId}`;
  return getOrSetCache(
    cacheKey,
    async () => {
      // Get child's school via parent_id pattern SP_<school_id>
      const { data: child } = await supabase
        .from("children")
        .select("parent_id")
        .eq("child_id", childId)
        .single();

      // Extract school_id from parent_id (SP_SCHOOL123 → SCHOOL123)
      const schoolId = child?.parent_id?.startsWith("SP_")
        ? child.parent_id.slice(3)
        : null;

      // Get school uuid from school_id
      let schoolUuid: string | null = null;
      if (schoolId) {
        const { data: school } = await supabase
          .from("schools")
          .select("id")
          .eq("school_id", schoolId)
          .single();
        schoolUuid = school?.id ?? null;
      }

      // Fetch public streams + private streams from student's school, only live/scheduled
      const { data, error } = await supabase
        .from("live_classes")
        .select("*, school:schools(name, logo_url, school_id)")
        .in("status", ["live", "scheduled"])
        .order("status", { ascending: true }) // live first
        .order("created_at", { ascending: false });

      if (error) throw error;

      const streams = (data || []).filter((cls: any) => {
        if (!cls.is_private) return true; // public — everyone sees
        if (schoolUuid && cls.school_uuid === schoolUuid) return true; // private — own school only
        return false;
      });

      return streams;
    },
    60, // 1 min cache
  );
}
