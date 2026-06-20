import type { FinalMood, InitialMood } from "./types";

const INITIAL_MOOD_SCORES: Record<InitialMood, number> = {
  Great: 5,
  Good: 4,
  Okay: 3,
  Bad: 2,
  Terrible: 1,
};

const FINAL_MOOD_DELTA: Record<FinalMood, number> = {
  "Much better": 2,
  Better: 1,
  "About the same": 0,
  Worse: -1,
  "Much worse": -2,
};

export function getInitialMoodScore(mood: InitialMood): number {
  return INITIAL_MOOD_SCORES[mood];
}

export function getEstimatedFinalScore(
  initialMood: InitialMood,
  finalMood: FinalMood
): number {
  return getInitialMoodScore(initialMood) + FINAL_MOOD_DELTA[finalMood];
}

export function scoreToMoodLabel(score: number): InitialMood {
  if (score >= 4.5) return "Great";
  if (score >= 3.5) return "Good";
  if (score >= 2.5) return "Okay";
  if (score >= 1.5) return "Bad";
  return "Terrible";
}
