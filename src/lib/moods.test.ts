import { describe, expect, it } from "vitest";
import { getMoodScore } from "@/lib/moods";
import { DETECTED_MOODS } from "@/lib/constants";
import type { DetectedMood } from "@/lib/types";

describe("getMoodScore", () => {
  it.each<[DetectedMood, number]>([
    ["Happy", 4],
    ["Frustrated", 2],
    ["Angry", 2],
    ["Sad", 1],
  ])("scores %s as %i", (mood, score) => {
    expect(getMoodScore(mood)).toBe(score);
  });

  it("returns 0 for unknown mood labels", () => {
    expect(getMoodScore("Better")).toBe(0);
  });
});

describe("mood score ordering", () => {
  it("orders detected moods from most to least positive", () => {
    const scores = DETECTED_MOODS.map(getMoodScore);
    expect(scores).toEqual([4, 1, 2, 2]);
  });
});
