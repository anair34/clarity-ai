import type { DetectedMood, PromptCategory } from "./types";
import { getMoodScore } from "@/lib/moods";

export const DETECTED_MOODS: DetectedMood[] = [
  "Happy",
  "Sad",
  "Angry",
  "Frustrated",
];

export const PROMPT_CATEGORIES: PromptCategory[] = [
  "Gratitude",
  "Career",
  "Relationships",
  "Confidence",
  "Stress",
  "Identity",
  "Growth",
  "Random",
];

export const FALLBACK_PROMPTS: Record<PromptCategory, string[]> = {
  Gratitude: [
    "What is something you are grateful for today that you usually overlook?",
    "Who made a small difference in your day recently?",
  ],
  Career: [
    "What part of your work or studies feels most uncertain right now?",
    "What would progress look like this week on your own terms?",
  ],
  Relationships: [
    "What conversation have you been avoiding?",
    "Who do you wish understood you better right now?",
  ],
  Confidence: [
    "What is something you accomplished recently that you have not given yourself credit for?",
    "What belief about yourself might be outdated?",
  ],
  Stress: [
    "What is one thing currently stressing you out more than it should?",
    "What would make tomorrow feel slightly better than today?",
  ],
  Identity: [
    "What part of yourself are you still figuring out?",
    "When do you feel most like yourself lately?",
  ],
  Growth: [
    "What are you avoiding because it feels uncomfortable?",
    "What would you try if you were not worried about failing?",
  ],
  Random: [
    "What has been on your mind more than you expected today?",
    "If you could ask yourself one honest question right now, what would it be?",
  ],
};

export const MOOD_COLORS: Record<DetectedMood, string> = {
  Happy: "bg-lime-100 text-lime-900 border-lime-200",
  Sad: "bg-sky-100 text-sky-900 border-sky-200",
  Angry: "bg-orange-100 text-orange-900 border-orange-200",
  Frustrated: "bg-amber-50 text-amber-900 border-amber-200",
};

export const MAX_REFLECTION_TURNS = 12;
/** @deprecated Use MAX_REFLECTION_TURNS — sessions no longer use a fixed question count. */
export const FOLLOW_UP_PROMPT_COUNT = MAX_REFLECTION_TURNS;

export const MIN_REFLECTION_WORDS = 50;
export const MIN_TURNS_BEFORE_CHECK_IN = 2;

export type ReflectionPhase = "detect" | "explore" | "solve";

/** Which arc stage this assistant turn is in (1-based question number). */
export function getReflectionPhase(
  turnNumber: number,
  total = MAX_REFLECTION_TURNS
): ReflectionPhase {
  if (turnNumber <= 1) return "detect";
  if (turnNumber <= Math.ceil(total * 0.5)) return "explore";
  return "solve";
}

export function getReflectionPhaseLabel(
  turnNumber: number,
  options?: { awaitingFeelingCheckIn?: boolean }
): string {
  if (options?.awaitingFeelingCheckIn) return "Checking in";
  const phase = getReflectionPhase(turnNumber);
  if (phase === "detect") return "Understanding how you feel";
  if (phase === "explore") return "Going deeper";
  return "Finding a path forward";
}

const DETECTED_MOOD_SET = new Set<string>(DETECTED_MOODS);

export function isDetectedMood(value: string | null | undefined): value is DetectedMood {
  return value != null && DETECTED_MOOD_SET.has(value);
}

export function isImproved(
  initialMood: DetectedMood | string | null,
  finalMood: DetectedMood | string | null
): boolean {
  if (!isDetectedMood(initialMood) || !isDetectedMood(finalMood)) return false;
  return getMoodScore(finalMood) > getMoodScore(initialMood);
}

export function getImprovementLabel(
  initialMood: DetectedMood | string | null,
  finalMood: DetectedMood | string | null
): "Improved" | "Same" | "Worse" | "Unknown" {
  if (!isDetectedMood(initialMood) || !isDetectedMood(finalMood)) return "Unknown";
  const delta = getMoodScore(finalMood) - getMoodScore(initialMood);
  if (delta > 0) return "Improved";
  if (delta < 0) return "Worse";
  return "Same";
}
