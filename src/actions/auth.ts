"use server";

import { supabase } from "@/lib/supabaseClient";
import { redis } from "@/lib/redis";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const SESSION_COOKIE_NAME = "qidzo_child_session_id";
const SESSION_TTL = 60 * 60 * 24 * 365; // 1 year in seconds

export async function loginChild(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }

  try {
    // 1. Find child by username
    const { data: child, error } = await supabase
      .from("children")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !child) {
      return { success: false, error: "Invalid username or password" };
    }

    // 2. Verify password
    const match = await bcrypt.compare(password, child.password_hash);
    if (!match) {
      return { success: false, error: "Invalid username or password" };
    }

    // 3. Create Session
    const sessionId = randomUUID();
    const sessionData = {
        id: child.child_id,
        username: child.username,
        role: child.role || "children", // Fallback to "children" if role is missing
        avatar_url: child.avatar_url
    };

    // 4. Store session in Redis
    await redis.set(`session:child:${sessionId}`, JSON.stringify(sessionData), { ex: SESSION_TTL });

    // 5. Set session ID in cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL,
        path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function logoutChild() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (sessionId) {
        // Remove from Redis
        await redis.del(`session:child:${sessionId}`);
    }

    // Remove cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
}

export async function getChildSession() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionId) return null;

    try {
        // Fetch session from Redis
        const sessionData = await redis.get(`session:child:${sessionId}`);
        
        if (!sessionData) {
            // Session expired or invalid in Redis, but cookie exists
            // Clean up cookie to avoid confusion
            // Note: We can't delete cookie in a Server Component directly if it's just rendering, 
            // but this is a Server Action or utility. 
            // If called from a Server Component, we can't mutate cookies. 
            // So we just return null.
            return null;
        }

        // Handle both object and string response from Redis (Upstash SDK can auto-parse JSON)
        return typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    } catch (error) {
        console.error("Session retrieval error:", error);
        return null;
    }
}
