import { describe, expect, it } from "vitest";
import {
  FALLBACK_PROMPTS,
  DETECTED_MOODS,
  MAX_REFLECTION_TURNS,
  MIN_TURNS_BEFORE_CHECK_IN,
  getImprovementLabel,
  getReflectionPhase,
  getReflectionPhaseLabel,
  isImproved,
  MOOD_COLORS,
  PROMPT_CATEGORIES,
} from "@/lib/constants";
import type { DetectedMood } from "@/lib/types";

describe("isImproved", () => {
  it.each<[DetectedMood, DetectedMood, boolean]>([
    ["Sad", "Happy", true],
    ["Angry", "Frustrated", false],
    ["Frustrated", "Happy", true],
    ["Happy", "Sad", false],
    ["Sad", "Sad", false],
  ])("%s -> %s = %s", (initial, final, expected) => {
    expect(isImproved(initial, final)).toBe(expected);
  });
});

describe("getImprovementLabel", () => {
  it.each<[DetectedMood, DetectedMood, string]>([
    ["Sad", "Happy", "Improved"],
    ["Angry", "Frustrated", "Same"],
    ["Happy", "Sad", "Worse"],
    ["Frustrated", "Frustrated", "Same"],
  ])("%s + %s => %s", (initial, final, expected) => {
    expect(getImprovementLabel(initial, final)).toBe(expected);
  });

  it.each([
    [null, "Happy"],
    ["Sad", null],
    [null, null],
  ] as const)("returns Unknown when data is incomplete (%s, %s)", (initial, final) => {
    expect(getImprovementLabel(initial, final)).toBe("Unknown");
  });
});

describe("reflection session phases", () => {
  it("maps early turns to detect and explore, later to solve", () => {
    expect(getReflectionPhase(1)).toBe("detect");
    expect(getReflectionPhase(2)).toBe("explore");
    expect(getReflectionPhase(7)).toBe("solve");
  });

  it("provides human-readable phase labels", () => {
    expect(getReflectionPhaseLabel(1)).toBe("Understanding how you feel");
    expect(getReflectionPhaseLabel(3)).toBe("Going deeper");
    expect(getReflectionPhaseLabel(8)).toBe("Finding a path forward");
    expect(
      getReflectionPhaseLabel(3, { awaitingFeelingCheckIn: true })
    ).toBe("Checking in");
  });
});

describe("mood and prompt constants", () => {
  it("caps reflection length with a max turn count", () => {
    expect(MAX_REFLECTION_TURNS).toBe(12);
  });

  it("waits before feeling-better check-ins", () => {
    expect(MIN_TURNS_BEFORE_CHECK_IN).toBe(2);
  });

  it("defines four detected moods", () => {
    expect(DETECTED_MOODS).toHaveLength(4);
    expect(new Set(DETECTED_MOODS).size).toBe(4);
  });

  it("defines eight prompt categories", () => {
    expect(PROMPT_CATEGORIES).toHaveLength(8);
    expect(PROMPT_CATEGORIES).toContain("Random");
  });
});

describe("MOOD_COLORS", () => {
  it.each(DETECTED_MOODS)("includes tailwind classes for %s", (mood) => {
    const classes = MOOD_COLORS[mood];
    expect(classes).toContain("border");
    expect(classes.length).toBeGreaterThan(10);
  });
});

describe("FALLBACK_PROMPTS", () => {
  it.each(PROMPT_CATEGORIES)(
    "provides non-empty prompts for %s",
    (category) => {
      const prompts = FALLBACK_PROMPTS[category];
      expect(prompts.length).toBeGreaterThanOrEqual(2);
      for (const prompt of prompts) {
        expect(prompt.trim().length).toBeGreaterThan(20);
        expect(prompt.endsWith("?")).toBe(true);
      }
    }
  );

  it("keeps fallback prompts unique within each category", () => {
    for (const category of PROMPT_CATEGORIES) {
      const prompts = FALLBACK_PROMPTS[category];
      expect(new Set(prompts).size).toBe(prompts.length);
    }
  });
});
