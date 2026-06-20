import { describe, expect, it } from "vitest";
import {
  getEstimatedFinalScore,
  getInitialMoodScore,
  scoreToMoodLabel,
} from "@/lib/moods";
import { FINAL_MOODS, INITIAL_MOODS } from "@/lib/constants";
import type { FinalMood, InitialMood } from "@/lib/types";

describe("getInitialMoodScore", () => {
  it.each<[InitialMood, number]>([
    ["Great", 5],
    ["Good", 4],
    ["Okay", 3],
    ["Bad", 2],
    ["Terrible", 1],
  ])("scores %s as %i", (mood, score) => {
    expect(getInitialMoodScore(mood)).toBe(score);
  });
});

describe("getEstimatedFinalScore", () => {
  it.each(
    INITIAL_MOODS.flatMap((initial) =>
      FINAL_MOODS.map(
        (final) =>
          [
            initial,
            final,
            getInitialMoodScore(initial) +
              ({ "Much better": 2, Better: 1, "About the same": 0, Worse: -1, "Much worse": -2 }[
                final
              ] as number),
          ] as const
      )
    )
  )("%s + %s delta", (initial, final, expected) => {
    expect(getEstimatedFinalScore(initial, final as FinalMood)).toBe(expected);
  });

  it("clamps logically for terrible start with much better finish", () => {
    expect(getEstimatedFinalScore("Terrible", "Much better")).toBe(3);
  });

  it("can drop below minimum mood score for great start with much worse finish", () => {
    expect(getEstimatedFinalScore("Great", "Much worse")).toBe(3);
  });
});

describe("scoreToMoodLabel boundaries", () => {
  it.each<[number, InitialMood]>([
    [6, "Great"],
    [4.5, "Great"],
    [4.4, "Good"],
    [3.5, "Good"],
    [3.4, "Okay"],
    [2.5, "Okay"],
    [2.4, "Bad"],
    [1.5, "Bad"],
    [1.4, "Terrible"],
    [0, "Terrible"],
    [-5, "Terrible"],
  ])("score %s maps to %s", (score, label) => {
    expect(scoreToMoodLabel(score)).toBe(label);
  });
});

describe("mood score monotonicity", () => {
  it("orders initial moods from best to worst in the constants array", () => {
    const scores = INITIAL_MOODS.map(getInitialMoodScore);
    expect(scores).toEqual([5, 4, 3, 2, 1]);
  });
});
