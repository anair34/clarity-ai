import OpenAI from "openai";
import { REFLECTION_SYSTEM_PROMPT } from "@/lib/ai/system-prompts";
import {
  buildDisplayFromPartialJson,
  buildReflectionUserPrompt,
} from "@/lib/ai/reflection-stream";
import { fetchReflectionMemory } from "@/lib/reflection-memory";
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { sessionId, userMessage, messageHistory, turnContext } = body as {
      sessionId: string;
      userMessage: string;
      messageHistory: ChatMessage[];
      turnContext?: import("@/lib/types").ReflectionTurnContext;
    };

    if (!sessionId || !userMessage?.trim()) {
      return new Response(
        JSON.stringify({ error: "sessionId and userMessage are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: session } = await supabase
      .from("reflection_sessions")
      .select("id, initial_mood")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const memoryContext = await fetchReflectionMemory(
      supabase,
      user.id,
      sessionId
    );

    const stream = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: REFLECTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildReflectionUserPrompt(
            userMessage,
            messageHistory ?? [],
            memoryContext,
            turnContext
          ),
        },
      ],
      temperature: 0.7,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let lastDisplay = "";

        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        };

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (!delta) continue;

            buffer += delta;
            const display = buildDisplayFromPartialJson(buffer);
            if (display.length > lastDisplay.length) {
              lastDisplay = display;
              send({ type: "text", text: display });
            }
          }

          if (!buffer) {
            send({ type: "error", error: "No response from AI" });
            controller.close();
            return;
          }

          const analysis = JSON.parse(buffer) as AnalyzeReflectionResponse;

          const updates: Record<string, unknown> = {
            primary_emotion: analysis.primaryEmotion,
            secondary_emotions: analysis.secondaryEmotions,
            intensity: analysis.intensity,
            topic: analysis.topic,
            underlying_concern: analysis.underlyingConcern,
          };

          if (!session.initial_mood) {
            updates.initial_mood = analysis.detectedMood;
          }

          await supabase
            .from("reflection_sessions")
            .update(updates)
            .eq("id", sessionId);

          send({ type: "done", analysis });
        } catch (error) {
          console.error("analyze-reflection stream error:", error);
          send({ type: "error", error: "Failed to analyze reflection" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("analyze-reflection stream setup error:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze reflection" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
