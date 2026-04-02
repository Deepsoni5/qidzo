import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getChildSession } from "@/actions/auth";
import { checkParentSubscription } from "@/actions/parent";
import { supabase } from "@/lib/supabaseClient";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const clerkUser = await currentUser();
    const childSession = await getChildSession();

    if (!clerkUser && !childSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Subscription Check
    let plan = "FREE";
    if (clerkUser) {
      const { data } = await supabase
        .from("parents")
        .select("subscription_plan")
        .eq("clerk_id", clerkUser.id)
        .single();
      plan = data?.subscription_plan?.toUpperCase() || "FREE";
    } else if (childSession) {
      const { data: child } = await supabase
        .from("children")
        .select("parent_id")
        .eq("child_id", (childSession as any).id)
        .single();
      if (child) {
        const { data: parent } = await supabase
          .from("parents")
          .select("subscription_plan")
          .eq("parent_id", child.parent_id)
          .single();
        plan = parent?.subscription_plan?.toUpperCase() || "FREE";
      }
    }

    if (plan !== "PRO" && plan !== "ELITE") {
      return NextResponse.json(
        { error: "Premium Access Required" },
        { status: 403 },
      );
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "API Key Missing" }, { status: 500 });
    }

    const { messages } = await req.json();

    const systemPrompt = {
      role: "system",
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
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API Error:", errorData);
      return NextResponse.json(
        { error: "Genie is a bit tired" },
        { status: response.status },
      );
    }

    // Return the stream directly to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Genie API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
