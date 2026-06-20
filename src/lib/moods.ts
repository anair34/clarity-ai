import type { DetectedMood } from "./types";

const MOOD_SCORES: Record<DetectedMood, number> = {
  Happy: 4,
  Frustrated: 2,
  Angry: 2,
  Sad: 1,
};

export function getMoodScore(mood: DetectedMood | string): number {
  if (mood in MOOD_SCORES) {
    return MOOD_SCORES[mood as DetectedMood];
  }
  return 0;
}

/** @deprecated Use getMoodScore */
export const getInitialMoodScore = getMoodScore;
