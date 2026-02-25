"use server";

import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "./auth";
import { currentUser } from "@clerk/nextjs/server";
import { invalidateCache } from "@/lib/redis";

interface InquiryData {
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export async function submitSchoolInquiry(data: InquiryData) {
  try {
    // 1. Determine User (Child or Parent)
    let childId: string | null = null;
    let parentId: string | null = null;
    let userType: "CHILD" | "PARENT" | null = null;

    const childSession = await getChildSession();
    if (childSession) {
      childId = childSession.id as string;
      userType = "CHILD";
    } else {
      const user = await currentUser();
      if (user) {
        const { data: parentData } = await supabase
          .from("parents")
          .select("parent_id")
          .eq("clerk_id", user.id)
          .single();

        if (parentData) {
          parentId = parentData.parent_id;
          userType = "PARENT";
        }
      }
    }

    if (!userType) {
      return {
        success: false,
        error: "You must be logged in to contact schools.",
      };
    }

    // 2. Validate input
    if (
      !data.name ||
      !data.email ||
      !data.phone ||
      !data.subject ||
      !data.message
    ) {
      return {
        success: false,
        error: "All fields are required.",
      };
    }

    if (data.message.length > 1000) {
      return {
        success: false,
        error: "Message must be less than 1000 characters.",
      };
    }

    // 3. Verify school exists
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, name")
      .eq("id", data.schoolId)
      .single();

    if (schoolError || !school) {
      return {
        success: false,
        error: "School not found.",
      };
    }

    // 4. Insert inquiry
    const { error: insertError } = await supabase
      .from("school_inquiries")
      .insert({
        school_id: data.schoolId,
        child_id: childId,
        parent_id: parentId,
        user_type: userType,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        status: "PENDING",
        is_read: false,
      });

    if (insertError) {
      console.error("Error inserting inquiry:", insertError);
      return {
        success: false,
        error: "Failed to submit inquiry. Please try again.",
      };
    }

    // Invalidate school dashboard cache
    await invalidateCache(`school:dashboard:${data.schoolId}`);

    return {
      success: true,
      message: "Inquiry submitted successfully!",
    };
  } catch (error) {
    console.error("Submit inquiry error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
