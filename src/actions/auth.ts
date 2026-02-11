"use server";

import { supabase } from "@/lib/supabaseClient";
// Redis can still be used for other things, but not strictly needed for stateless JWT
import { redis } from "@/lib/redis"; 
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { clerkClient } from "@clerk/nextjs/server";

const SESSION_COOKIE_NAME = "qidzo_child_token"; // Changed name to reflect it's a token
const SESSION_TTL = 60 * 60 * 24 * 365; // 1 year in seconds
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "default_secret_please_change_in_production"
);

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

    // 3. Create Session Payload
    const sessionPayload = {
        id: child.child_id,
        username: child.username,
        role: child.role || "children", // Fallback to "children" if role is missing
        avatar_url: child.avatar_url
    };

    // 4. Generate JWT
    const token = await new SignJWT(sessionPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1y') // 1 year expiration
        .sign(JWT_SECRET);

    // 5. Set JWT in cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
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
    // With JWT, we just delete the cookie. 
    // If we wanted to blacklist tokens before expiry, we'd store them in Redis here.
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
}

export async function getChildSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!token) return null;

    try {
        // Verify JWT
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (error) {
        // Token invalid or expired
        console.error("Session verification error:", error);
        return null;
    }
}

/**
 * Unified check for current user role (Parent or Child).
 * Prioritizes checking for Parent (Clerk), then Child (JWT).
 * Uses Redis caching for Parent check to ensure speed.
 */
export async function getCurrentUserRole() {
    // 1. Check Parent Session (Clerk)
    // We can't access Clerk `auth()` directly in a simple utility without importing it
    // But we can rely on `checkIsParent` which we already have in `parent.ts`
    // However, to avoid circular deps or complexity, let's just do a quick check here if needed
    // OR, better, let the UI components handle the specific checks. 
    // BUT the user asked for a unified way.
    
    // Let's import the checkIsParent from parent actions dynamically or just reuse the logic if possible.
    // Actually, `checkIsParent` is already cached with Redis.
    // So we just need to combine them.
    
    const { checkIsParent } = await import("./parent");
    const isParent = await checkIsParent();
    
    if (isParent) {
        return { role: "parent", isParent: true, isChild: false };
    }

    // 2. Check Child Session (JWT)
    const childSession = await getChildSession();
    if (childSession) {
        // Fetch latest child data to get focus_mode (ensure real-time)
        const { data: childData } = await supabase
            .from("children")
            .select("focus_mode")
            .eq("child_id", childSession.id)
            .single();

        return { 
            role: "child", 
            isParent: false, 
            isChild: true, 
            child: {
                ...childSession,
                focus_mode: childData?.focus_mode || false
            } 
        };
    }

    return { role: "guest", isParent: false, isChild: false };
}

export async function updateClerkUserMetadata(userId: string, firstName: string, lastName: string) {
    try {
        const client = await clerkClient();
        await client.users.updateUser(userId, {
            firstName,
            lastName,
            unsafeMetadata: {
                role: "parent",
                onboarding_complete: true
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update Clerk user metadata:", error);
        return { success: false, error: JSON.stringify(error) };
    }
}
