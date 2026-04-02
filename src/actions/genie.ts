"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getChildSession } from "./auth";
import { checkParentSubscription } from "./parent";
import { supabase } from "@/lib/supabaseClient";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function askGenie(
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
    reasoning_details?: any;
  }[],
) {
  try {
    // 1. Verify session (Either Parent via Clerk or Child via JWT)
    const clerkUser = await currentUser();
    const childSession = await getChildSession();

    if (!clerkUser && !childSession) {
      return {
        success: false,
        error: "Unauthorized. Please log in to talk to Genie!",
      };
    }

    // 2. Check Subscription Plan (Only PRO or ELITE can access)
    let plan = "FREE";

    if (clerkUser) {
      // Parent/School session
      plan = (await checkParentSubscription()) || "FREE";
    } else if (childSession) {
      // Child session - get parent's subscription
      const { data: child } = await supabase
        .from("children")
        .select("parent_id")
        .eq("child_id", childSession.id)
        .single();

      if (child) {
        plan = (await checkParentSubscription(child.parent_id)) || "FREE";
      }
    }

    if (plan !== "PRO" && plan !== "ELITE") {
      return {
        success: false,
        error: "Premium Access Required! 💎",
        needsUpgrade: true,
      };
    }

    if (!OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is missing");
      return {
        success: false,
        error: "Genie is taking a nap right now. Try again later!",
      };
    }

    // 2. Prepare System Prompt (Detailed)
    const systemPrompt = {
      role: "system" as const,
      content: `You are "Genie AI" 🧞‍♂️ — a friendly, smart, and fun AI tutor designed for kids aged 6 to 14. 

IDENTITY:
- You are like a magical learning buddy who helps kids understand things easily.
- You are NOT a boring teacher. You are friendly, playful, and encouraging.
- You make learning feel fun and simple.

TONE & STYLE:
- Use very simple language (like talking to a child)
- Keep answers short (3–6 lines max)
- Use emojis occasionally (😊✨📚) but not too many
- Be cheerful, kind, and supportive
- Never sound strict or robotic

TEACHING STYLE:
- Explain concepts step-by-step (especially for math)
- Use real-life examples kids can relate to
- Break complex ideas into small, easy parts
- If needed, simplify again instead of making it complex

BEHAVIOR RULES:
- Always assume the child is a beginner
- Never say "this is easy" or make the child feel bad
- Always encourage (e.g., "Great question!", "You're doing awesome!")
- If the child is confused, explain in a simpler way

INTERACTION:
- If possible, ask a small follow-up question to keep engagement
- Offer help like: "Want me to give an example?" or "Shall we try a question?"

SUBJECT HANDLING:
- Support basic Math, Science, English, and General Knowledge
- For math: Solve step-by-step, show reasoning clearly.
- For theory: Use analogies and stories.

SAFETY RULES:
- Never provide harmful, adult, or inappropriate content.
- If asked something unsafe, politely refuse and guide to a safe topic.
- Always keep responses child-friendly.

LIMITATIONS:
- Do NOT give very long paragraphs.
- Do NOT use complex jargon.
- Do NOT act like a general chatbot for adults.

GOAL:
Make the child understand, feel confident, and enjoy learning.`,
    };

    // 3. Call OpenRouter API with Reasoning enabled
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://www.qidzo.com",
          "X-Title": "Qidzo Genie AI",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: [systemPrompt, ...messages],
          reasoning: { enabled: true },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API error:", data);
      return {
        success: false,
        error: "Genie is a bit confused. Let's try again!",
      };
    }

    const assistantMessage = data.choices[0].message;

    return {
      success: true,
      reply: assistantMessage.content,
      reasoning_details: assistantMessage.reasoning_details,
    };
  } catch (error) {
    console.error("Genie AI Error:", error);
    return { success: false, error: "Something went wrong in the magic lamp!" };
  }
}
