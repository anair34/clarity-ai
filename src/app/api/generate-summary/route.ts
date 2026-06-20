import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/system-prompts";
import { fetchReflectionMemory } from "@/lib/reflection-memory";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, GenerateSummaryResponse } from "@/lib/types";

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
    const { sessionId, messages } = body as {
      sessionId: string;
      messages: ChatMessage[];
    };

    if (!sessionId || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "sessionId and messages are required" },
        { status: 400 }
      );
    }

    const { data: session } = await supabase
      .from("reflection_sessions")
      .select("id, initial_mood")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const transcript = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const memoryContext = await fetchReflectionMemory(
      supabase,
      user.id,
      sessionId
    );

    const userPromptParts = [
      `Mood at start of session (AI-detected): ${session.initial_mood ?? "Unknown"}`,
    ];

    if (memoryContext) {
      userPromptParts.push(
        `Context from past reflections:\n${memoryContext}`
      );
    }

    userPromptParts.push(`Reflection transcript:\n${transcript}`);

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        {
          role: "user",
          content: userPromptParts.join("\n\n"),
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

    const summaryData = JSON.parse(content) as GenerateSummaryResponse;

    await supabase
      .from("reflection_sessions")
      .update({
        summary: summaryData.summary,
        primary_emotion: summaryData.keyEmotion,
        underlying_concern: summaryData.keyConcern,
        final_mood: summaryData.detectedMood,
      })
      .eq("id", sessionId);

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error("generate-summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
