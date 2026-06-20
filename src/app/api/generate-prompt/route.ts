import { NextResponse } from "next/server";
import OpenAI from "openai";
import { PROMPT_GENERATOR_SYSTEM_PROMPT } from "@/lib/ai/system-prompts";
import { FALLBACK_PROMPTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { PromptCategory } from "@/lib/types";

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getFallbackPrompt(category: PromptCategory): string {
  const prompts = FALLBACK_PROMPTS[category];
  return prompts[Math.floor(Math.random() * prompts.length)];
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
    const { category } = body as { category: PromptCategory };

    if (!category) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 }
      );
    }

    let prompt = getFallbackPrompt(category);

    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await getOpenAIClient().chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: PROMPT_GENERATOR_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Generate one unique reflection prompt in the "${category}" category.`,
            },
          ],
          temperature: 0.9,
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as { prompt: string };
          if (parsed.prompt) prompt = parsed.prompt;
        }
      } catch {
        // keep fallback prompt
      }
    }

    const { error: insertError } = await supabase.from("prompt_history").insert({
      user_id: user.id,
      category,
      prompt,
      used: false,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("generate-prompt error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
