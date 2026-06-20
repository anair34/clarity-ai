import type { AnalyzeReflectionResponse, GenerateSummaryResponse } from "@/lib/types";

export const mockUser = {
  id: "user-123",
  email: "test@example.com",
};

export const mockAnalysis: AnalyzeReflectionResponse = {
  primaryEmotion: "Anxiety",
  secondaryEmotions: ["Overwhelm"],
  moodScore: "Bad",
  intensity: "High",
  topic: "Career",
  underlyingConcern: "Fear of falling behind",
  userFacingInsight:
    "It sounds like you may be feeling anxious and overwhelmed about your progress.",
  nextPrompt: "What makes you feel like you are behind right now?",
};

export const mockSummary: GenerateSummaryResponse = {
  summary:
    "You started feeling anxious about career progress and explored comparison with peers.",
  keyEmotion: "Anxiety",
  keyConcern: "Comparison with peers",
  suggestedNextPrompt: "What would progress look like on your own timeline?",
};

export { makeSession, readJson } from "@/test/factories";
