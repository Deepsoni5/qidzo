"use server";

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";

export interface SchoolInquiry {
  id: string;
  inquiry_id: string;
  school_id: string;
  child_id: string | null;
  parent_id: string | null;
  user_type: "CHILD" | "PARENT";
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "PENDING" | "READ" | "REPLIED" | "CLOSED";
  is_read: boolean;
  admin_notes: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
  child?: {
    name: string;
    username: string;
    avatar: string | null;
  } | null;
  parent?: {
    name: string;
    email: string;
  } | null;
}

export interface InquiriesFilters {
  status?: string;
  userType?: string;
  search?: string;
  sortBy?: "newest" | "oldest" | "unread";
}

export async function getSchoolInquiries(filters: InquiriesFilters = {}) {
  try {
    // 1. Verify school authentication
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const { data: schoolData } = await supabase
      .from("schools")
      .select("id, school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!schoolData) {
      return { success: false, error: "School not found", data: [] };
    }

    // 2. Build query
    let query = supabase
      .from("school_inquiries")
      .select(
        `
        *,
        child:children(name, username, avatar),
        parent:parents(name, email)
      `,
      )
      .eq("school_id", schoolData.id);

    // Apply filters
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status.toUpperCase());
    }

    if (filters.userType && filters.userType !== "all") {
      query = query.eq("user_type", filters.userType.toUpperCase());
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,message.ilike.%${filters.search}%`,
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "unread":
        query = query
          .order("is_read", { ascending: true })
          .order("created_at", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching inquiries:", error);
      return { success: false, error: "Failed to fetch inquiries", data: [] };
    }

    return { success: true, data: data as SchoolInquiry[] };
  } catch (error) {
    console.error("Get inquiries error:", error);
    return { success: false, error: "Unexpected error", data: [] };
  }
}

export async function markInquiryAsRead(inquiryId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: schoolData } = await supabase
      .from("schools")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!schoolData) {
      return { success: false, error: "School not found" };
    }

    // Verify inquiry belongs to this school
    const { data: inquiry } = await supabase
      .from("school_inquiries")
      .select("school_id")
      .eq("id", inquiryId)
      .single();

    if (!inquiry || inquiry.school_id !== schoolData.id) {
      return { success: false, error: "Inquiry not found" };
    }

    const { error } = await supabase
      .from("school_inquiries")
      .update({
        is_read: true,
        status: "READ",
      })
      .eq("id", inquiryId);

    if (error) {
      console.error("Error marking inquiry as read:", error);
      return { success: false, error: "Failed to update inquiry" };
    }

    return { success: true };
  } catch (error) {
    console.error("Mark as read error:", error);
    return { success: false, error: "Unexpected error" };
  }
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: "PENDING" | "READ" | "REPLIED" | "CLOSED",
  adminNotes?: string,
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: schoolData } = await supabase
      .from("schools")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!schoolData) {
      return { success: false, error: "School not found" };
    }

    // Verify inquiry belongs to this school
    const { data: inquiry } = await supabase
      .from("school_inquiries")
      .select("school_id")
      .eq("id", inquiryId)
      .single();

    if (!inquiry || inquiry.school_id !== schoolData.id) {
      return { success: false, error: "Inquiry not found" };
    }

    const updateData: any = { status };

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    if (status === "REPLIED") {
      updateData.replied_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("school_inquiries")
      .update(updateData)
      .eq("id", inquiryId);

    if (error) {
      console.error("Error updating inquiry:", error);
      return { success: false, error: "Failed to update inquiry" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update inquiry error:", error);
    return { success: false, error: "Unexpected error" };
  }
}

export async function getInquiryStats() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Unauthorized", stats: null };
    }

    const { data: schoolData } = await supabase
      .from("schools")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!schoolData) {
      return { success: false, error: "School not found", stats: null };
    }

    // Get counts for different statuses
    const { count: totalCount } = await supabase
      .from("school_inquiries")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolData.id);

    const { count: unreadCount } = await supabase
      .from("school_inquiries")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolData.id)
      .eq("is_read", false);

    const { count: pendingCount } = await supabase
      .from("school_inquiries")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolData.id)
      .eq("status", "PENDING");

    const { count: repliedCount } = await supabase
      .from("school_inquiries")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolData.id)
      .eq("status", "REPLIED");

    return {
      success: true,
      stats: {
        total: totalCount || 0,
        unread: unreadCount || 0,
        pending: pendingCount || 0,
        replied: repliedCount || 0,
      },
    };
  } catch (error) {
    console.error("Get inquiry stats error:", error);
    return { success: false, error: "Unexpected error", stats: null };
  }
}
