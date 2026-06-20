import { NextResponse } from "next/server";
import OpenAI from "openai";
import { REFLECTION_SYSTEM_PROMPT } from "@/lib/ai/system-prompts";
import { createClient } from "@/lib/supabase/server";
import type { AnalyzeReflectionResponse, ChatMessage } from "@/lib/types";

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, userMessage, messageHistory } = body as {
      sessionId: string;
      userMessage: string;
      messageHistory: ChatMessage[];
    };

    if (!sessionId || !userMessage?.trim()) {
      return NextResponse.json(
        { error: "sessionId and userMessage are required" },
        { status: 400 }
      );
    }

    const { data: session } = await supabase
      .from("reflection_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const historyText = (messageHistory ?? [])
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: REFLECTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Conversation so far:\n${historyText}\n\nLatest user message:\n${userMessage}`,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(content) as AnalyzeReflectionResponse;

    await supabase
      .from("reflection_sessions")
      .update({
        primary_emotion: analysis.primaryEmotion,
        secondary_emotions: analysis.secondaryEmotions,
        intensity: analysis.intensity,
        topic: analysis.topic,
        underlying_concern: analysis.underlyingConcern,
      })
      .eq("id", sessionId);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("analyze-reflection error:", error);
    return NextResponse.json(
      { error: "Failed to analyze reflection" },
      { status: 500 }
    );
  }
}
