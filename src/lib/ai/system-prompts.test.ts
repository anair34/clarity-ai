import { describe, expect, it } from "vitest";
import {
  PROMPT_GENERATOR_SYSTEM_PROMPT,
  REFLECTION_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
} from "@/lib/ai/system-prompts";

describe("REFLECTION_SYSTEM_PROMPT safety", () => {
  it.each([
    "NOT a therapist",
    "do not diagnose",
    "nextPrompt",
    "userFacingInsight",
    "valid JSON",
    "self-harm",
    "primaryEmotion",
    "underlyingConcern",
  ])("includes required guidance token: %s", (token) => {
    expect(REFLECTION_SYSTEM_PROMPT).toContain(token);
  });

  it("forbids prescriptive fix-it responses implicitly via guidelines", () => {
    expect(REFLECTION_SYSTEM_PROMPT.toLowerCase()).toContain("do not give advice");
  });

  it("asks for exactly one follow-up question", () => {
    expect(REFLECTION_SYSTEM_PROMPT).toContain("ONE thoughtful follow-up question");
  });
});

describe("SUMMARY_SYSTEM_PROMPT safety", () => {
  it.each(["valid JSON", "summary", "keyEmotion", "suggestedNextPrompt", "NOT a therapist"])(
    "includes %s",
    (token) => {
      expect(SUMMARY_SYSTEM_PROMPT).toContain(token);
    }
  );
});

describe("PROMPT_GENERATOR_SYSTEM_PROMPT safety", () => {
  it.each(["valid JSON", "prompt", "non-clinical", "self-reflection"])(
    "includes %s",
    (token) => {
      expect(PROMPT_GENERATOR_SYSTEM_PROMPT).toContain(token);
    }
  );
});

describe("prompt JSON schemas", () => {
  it("lists all five mood score options in reflection prompt", () => {
    for (const mood of ["Great", "Good", "Okay", "Bad", "Terrible"]) {
      expect(REFLECTION_SYSTEM_PROMPT).toContain(mood);
    }
  });

  it("lists intensity options", () => {
    for (const level of ["Low", "Medium", "High"]) {
      expect(REFLECTION_SYSTEM_PROMPT).toContain(level);
    }
  });
});
