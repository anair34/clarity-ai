import type { FinalMood, InitialMood, PromptCategory } from "./types";

export const INITIAL_MOODS: InitialMood[] = [
  "Great",
  "Good",
  "Okay",
  "Bad",
  "Terrible",
];

export const FINAL_MOODS: FinalMood[] = [
  "Much better",
  "Better",
  "About the same",
  "Worse",
  "Much worse",
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

export const MOOD_COLORS: Record<InitialMood, string> = {
  Great: "bg-lime-100 text-lime-900 border-lime-200",
  Good: "bg-green-100 text-green-800 border-green-200",
  Okay: "bg-amber-50 text-amber-900 border-amber-200",
  Bad: "bg-orange-50 text-orange-900 border-orange-200",
  Terrible: "bg-stone-200 text-stone-800 border-stone-300",
};

export const FOLLOW_UP_PROMPT_COUNT = 3;

export function isImproved(finalMood: FinalMood | null): boolean {
  return finalMood === "Much better" || finalMood === "Better";
}

export function getImprovementLabel(
  initialMood: InitialMood | null,
  finalMood: FinalMood | null
): "Improved" | "Same" | "Worse" | "Unknown" {
  if (!initialMood || !finalMood) return "Unknown";
  if (isImproved(finalMood)) return "Improved";
  if (finalMood === "About the same") return "Same";
  return "Worse";
}
