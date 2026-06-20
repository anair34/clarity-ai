import { describe, expect, it } from "vitest";
import {
  FALLBACK_PROMPTS,
  FINAL_MOODS,
  FOLLOW_UP_PROMPT_COUNT,
  getImprovementLabel,
  INITIAL_MOODS,
  isImproved,
  MOOD_COLORS,
  PROMPT_CATEGORIES,
} from "@/lib/constants";
import type { FinalMood, InitialMood } from "@/lib/types";

describe("isImproved", () => {
  it.each<[FinalMood, boolean]>([
    ["Much better", true],
    ["Better", true],
    ["About the same", false],
    ["Worse", false],
    ["Much worse", false],
  ])("returns %s -> %s", (mood, expected) => {
    expect(isImproved(mood)).toBe(expected);
  });
});

describe("getImprovementLabel", () => {
  it.each<[InitialMood, FinalMood, string]>([
    ["Terrible", "Much better", "Improved"],
    ["Terrible", "Better", "Improved"],
    ["Terrible", "About the same", "Same"],
    ["Terrible", "Worse", "Worse"],
    ["Terrible", "Much worse", "Worse"],
    ["Bad", "Much better", "Improved"],
    ["Bad", "Better", "Improved"],
    ["Bad", "About the same", "Same"],
    ["Bad", "Worse", "Worse"],
    ["Bad", "Much worse", "Worse"],
    ["Okay", "Much better", "Improved"],
    ["Okay", "Better", "Improved"],
    ["Okay", "About the same", "Same"],
    ["Okay", "Worse", "Worse"],
    ["Okay", "Much worse", "Worse"],
    ["Good", "Much better", "Improved"],
    ["Good", "Better", "Improved"],
    ["Good", "About the same", "Same"],
    ["Good", "Worse", "Worse"],
    ["Good", "Much worse", "Worse"],
    ["Great", "Much better", "Improved"],
    ["Great", "Better", "Improved"],
    ["Great", "About the same", "Same"],
    ["Great", "Worse", "Worse"],
    ["Great", "Much worse", "Worse"],
  ])("%s + %s => %s", (initial, final, expected) => {
    expect(getImprovementLabel(initial, final)).toBe(expected);
  });

  it.each([
    [null, "Better"],
    ["Bad", null],
    [null, null],
  ] as const)("returns Unknown when data is incomplete (%s, %s)", (initial, final) => {
    expect(getImprovementLabel(initial, final)).toBe("Unknown");
  });
});

describe("mood and prompt constants", () => {
  it("uses exactly three follow-up prompts per session", () => {
    expect(FOLLOW_UP_PROMPT_COUNT).toBe(3);
  });

  it("defines five initial moods", () => {
    expect(INITIAL_MOODS).toHaveLength(5);
    expect(new Set(INITIAL_MOODS).size).toBe(5);
  });

  it("defines five final mood options", () => {
    expect(FINAL_MOODS).toHaveLength(5);
    expect(new Set(FINAL_MOODS).size).toBe(5);
  });

  it("defines eight prompt categories", () => {
    expect(PROMPT_CATEGORIES).toHaveLength(8);
    expect(PROMPT_CATEGORIES).toContain("Random");
  });
});

describe("MOOD_COLORS", () => {
  it.each(INITIAL_MOODS)("includes tailwind classes for %s", (mood) => {
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
