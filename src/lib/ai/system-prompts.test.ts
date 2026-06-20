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
    "shouldAskFeelingBetter",
    "readyToWrapUp",
    "moodTrend",
  ])("includes required guidance token: %s", (token) => {
    expect(REFLECTION_SYSTEM_PROMPT).toContain(token);
  });

  it("uses a dynamic flow instead of a fixed question count", () => {
    expect(REFLECTION_SYSTEM_PROMPT).toContain("no fixed question count");
    expect(REFLECTION_SYSTEM_PROMPT).toContain("Feeling-better check-ins");
  });

  it("asks for exactly one follow-up question", () => {
    expect(REFLECTION_SYSTEM_PROMPT).toContain("ONE follow-up");
  });

  it("includes memory guidance for past reflections", () => {
    expect(REFLECTION_SYSTEM_PROMPT).toContain("Memory from past reflections");
  });
});

describe("SUMMARY_SYSTEM_PROMPT safety", () => {
  it.each(["valid JSON", "summary", "keyEmotion", "suggestedNextPrompt", "detectedMood", "NOT a therapist"])(
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
  it("lists all four detected mood options in reflection prompt", () => {
    for (const mood of ["Happy", "Sad", "Angry", "Frustrated"]) {
      expect(REFLECTION_SYSTEM_PROMPT).toContain(mood);
    }
  });

  it("lists intensity options", () => {
    for (const level of ["Low", "Medium", "High"]) {
      expect(REFLECTION_SYSTEM_PROMPT).toContain(level);
    }
  });
});
