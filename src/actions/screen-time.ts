"use server";

import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "./auth";

/**
 * Records screen time for the logged-in child.
 * Increments the seconds_spent for the current IST date and hour.
 */
export async function recordScreenTime(seconds: number = 60) {
  try {
    // 1. Get the current logged-in child
    const childSession: any = await getChildSession();
    if (!childSession || !childSession.id) {
      // Don't log error here as it's expected for parents/guests
      return { success: false, error: "No active child session" };
    }

    // 2. Calculate current IST Date and Hour
    // We use Asia/Kolkata for Indian Standard Time
    const now = new Date();
    
    // Format: 'YYYY-MM-DD'
    const istDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);

    // Format: 'HH' (0-23)
    const istHour = parseInt(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        hour12: false
      }).format(now)
    );

    console.log("Recording time for child:", childSession.id, "at IST hour:", istHour);

    // 3. Upsert the log entry
    // If a row exists for this (child, date, hour, type), increment seconds_spent.
    // Otherwise, create a new row.
    
    // Step 3a: Try to update first
    const { data: existingLog, error: fetchError } = await supabase
      .from("child_screen_logs")
      .select("id, seconds_spent")
      .eq("child_id", childSession.id)
      .eq("ist_date", istDate)
      .eq("ist_hour", istHour)
      .eq("activity_type", "general")
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingLog) {
      // Update existing
      const { error: updateError } = await supabase
        .from("child_screen_logs")
        .update({ 
          seconds_spent: (existingLog.seconds_spent || 0) + seconds,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingLog.id);
        
      if (updateError) {
        console.error("Supabase update error:", updateError);
        throw updateError;
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from("child_screen_logs")
        .insert({
          child_id: childSession.id,
          ist_date: istDate,
          ist_hour: istHour,
          seconds_spent: seconds,
          activity_type: "general"
        });
        
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }
    }

    // 4. Also update the total learning_hours in the children table
    const hoursToAdd = seconds / 3600;
    
    const { data: childData } = await supabase
      .from("children")
      .select("learning_hours")
      .eq("child_id", childSession.id)
      .single();

    if (childData) {
      await supabase
        .from("children")
        .update({ 
          learning_hours: Number(childData.learning_hours || 0) + hoursToAdd 
        })
        .eq("child_id", childSession.id);
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording screen time:", error);
    return { success: false, error: "Failed to record screen time" };
  }
}

/**
 * Checks if the child is currently allowed to access the platform.
 * Returns information about remaining time and slot status.
 */
export async function checkScreenTimeStatus() {
  try {
    const childSession: any = await getChildSession();
    if (!childSession || !childSession.id) {
      return { isAllowed: true }; // Not a child session
    }

    // 1. Get child's limit settings
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("screen_time_limit, allowed_time_slots")
      .eq("child_id", childSession.id)
      .single();

    if (childError || !child) throw childError;

    // If no limit is set, they are always allowed
    if (child.screen_time_limit === null) {
      return { isAllowed: true };
    }

    const now = new Date();
    const istDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);

    const istHour = parseInt(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        hour12: false
      }).format(now)
    );
    
    const istMinutes = parseInt(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        minute: '2-digit'
      }).format(now)
    );

    const currentTotalMinutes = istHour * 60 + istMinutes;

    // 2. Check Time Slots if specified
    const slots: string[] = Array.isArray(child.allowed_time_slots) 
      ? child.allowed_time_slots 
      : (typeof child.allowed_time_slots === 'string' ? JSON.parse(child.allowed_time_slots) : []);

    if (slots.length > 0) {
      let isInSlot = false;
      for (const slot of slots) {
        const [start, end] = slot.split('-');
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        const startTotal = startH * 60 + (startM || 0);
        let endTotal = endH * 60 + (endM || 0);

        if (endTotal <= startTotal) {
          // Overnight slot
          if (currentTotalMinutes >= startTotal || currentTotalMinutes < endTotal) {
            isInSlot = true;
            break;
          }
        } else {
          if (currentTotalMinutes >= startTotal && currentTotalMinutes < endTotal) {
            isInSlot = true;
            break;
          }
        }
      }

      if (!isInSlot) {
        return { 
          isAllowed: false, 
          reason: 'outside_slot',
          message: "You're outside your allowed time window! 🕒" 
        };
      }
    }

    // 3. Check Total Daily Limit
    const { data: logs, error: logsError } = await supabase
      .from("child_screen_logs")
      .select("seconds_spent")
      .eq("child_id", childSession.id)
      .eq("ist_date", istDate);

    if (logsError) throw logsError;

    const totalSecondsSpent = logs?.reduce((sum, log) => sum + (log.seconds_spent || 0), 0) || 0;
    const totalMinutesSpent = totalSecondsSpent / 60;
    const limitMinutes = child.screen_time_limit * 60;

    if (totalMinutesSpent >= limitMinutes) {
      return { 
        isAllowed: false, 
        reason: 'limit_reached',
        message: "Your daily screen time limit is reached! 🌈" 
      };
    }

    return { 
      isAllowed: true, 
      remainingMinutes: Math.max(0, limitMinutes - totalMinutesSpent) 
    };
  } catch (error) {
    console.error("Error checking screen time status:", error);
    return { isAllowed: true }; // Fallback to allowed on error to prevent lockout
  }
}

/**
 * Fetches daily screen time logs for a specific child in IST.
 * If childId is not provided, it fetches aggregated logs for all children.
 */
export async function getChildDailyActivity(childId?: string, date?: string) {
  try {
    // Use the exact same date logic as recordScreenTime for consistency
    const now = new Date();
    const targetDate = date || new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);

    let query = supabase
      .from("child_screen_logs")
      .select("ist_hour, seconds_spent")
      .eq("ist_date", targetDate);

    if (childId) {
      // Try to match child_id directly. 
      // We use .eq() which is standard for character varying.
      query = query.eq("child_id", childId);
    }

    let { data, error } = await query.order("ist_hour", { ascending: true });

    if (error) throw error;

    // If no data found for the provided childId, and it might be a UUID, 
    // try to resolve it to a child_id varchar first.
    if (childId && (!data || data.length === 0)) {
      const { data: childInfo } = await supabase
        .from("children")
        .select("child_id")
        .or(`id.eq.${childId},child_id.eq.${childId}`)
        .maybeSingle();
      
      if (childInfo && childInfo.child_id !== childId) {
        const { data: retryData } = await supabase
          .from("child_screen_logs")
          .select("ist_hour, seconds_spent")
          .eq("ist_date", targetDate)
          .eq("child_id", childInfo.child_id)
          .order("ist_hour", { ascending: true });
        
        if (retryData && retryData.length > 0) {
          data = retryData;
        }
      }
    }

    // Aggregated hour data across all children
    const fullDayData = Array.from({ length: 24 }, (_, i) => {
      const logsForHour = data?.filter(d => d.ist_hour === i) || [];
      const totalSeconds = logsForHour.reduce((acc, curr) => acc + (curr.seconds_spent || 0), 0);
      return {
        hour: i,
        displayHour: `${i}:00`,
        minutes: Math.round(totalSeconds / 60)
      };
    });

    return { success: true, data: fullDayData };
  } catch (error) {
    console.error("Error fetching daily activity:", error);
    return { success: false, error: "Failed to fetch activity" };
  }
}
