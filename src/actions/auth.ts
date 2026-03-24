"use server";

import { supabase } from "@/lib/supabaseClient";
// Redis can still be used for other things, but not strictly needed for stateless JWT
import { redis } from "@/lib/redis";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

const SESSION_COOKIE_NAME = "qidzo_child_token"; // Changed name to reflect it's a token
const ADMIN_SESSION_COOKIE_NAME = "qidzo_admin_token";
const SESSION_TTL = 60 * 60 * 24 * 365; // 1 year in seconds
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_please_change_in_production",
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

    // 3. Create Session Payload with essential child data
    const sessionPayload = {
      id: child.child_id,
      username: child.username,
      name: child.name,
      avatar: child.avatar,
      level: child.level,
      xp_points: child.xp_points,
      role: child.role || "children",
    };

    // 4. Generate JWT
    const token = await new SignJWT(sessionPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1y") // 1 year expiration
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
  // 1. Check Parent/School Session (Clerk)
  const { checkIsParent, checkIsSchool } = await import("./parent");

  const [isParent, isSchool] = await Promise.all([
    checkIsParent(),
    checkIsSchool(),
  ]);

  if (isParent) {
    const user = await currentUser();
    return {
      role: "parent",
      isParent: true,
      isSchool: false,
      isChild: false,
      parent: {
        id: user?.id,
      },
    };
  }
  if (isSchool) {
    const user = await currentUser();
    // Fetch school profile to get the school_id
    const { data: schoolData } = await supabase
      .from("schools")
      .select("id, school_id")
      .eq("clerk_id", user?.id)
      .single();

    return {
      role: "school",
      isParent: false,
      isSchool: true,
      isChild: false,
      school: {
        id: schoolData?.id,
        school_id: schoolData?.school_id,
      },
    };
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
        focus_mode: childData?.focus_mode || false,
      },
    };
  }

  return { role: "guest", isParent: false, isChild: false };
}

export async function updateClerkUserMetadata(
  userId: string,
  firstName: string,
  lastName: string,
  role: "parent" | "school" = "parent",
) {
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      firstName,
      lastName,
      publicMetadata: {
        // ✅ CORRECT
        role,
        onboarding_complete: true,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update Clerk user metadata:", error);
    return { success: false, error: JSON.stringify(error) };
  }
}

export async function loginAdmin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    const sessionPayload = {
      email,
      role: "admin",
      isAdmin: true,
    };

    const token = await new SignJWT(sessionPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // Admin session lasts 24 hours
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return { success: true };
  }

  return { success: false, error: "Invalid admin credentials" };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  return { success: true };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}
