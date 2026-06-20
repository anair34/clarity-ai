export type DetectedMood = "Happy" | "Sad" | "Angry" | "Frustrated";

export type MoodTrend = "worse" | "same" | "better";

export type MessageRole = "user" | "assistant" | "system";

export type PromptCategory =
  | "Gratitude"
  | "Career"
  | "Relationships"
  | "Confidence"
  | "Stress"
  | "Identity"
  | "Growth"
  | "Random";

export interface ReflectionMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ReflectionSession {
  id: string;
  user_id: string;
  initial_mood: DetectedMood | string | null;
  final_mood: DetectedMood | string | null;
  primary_emotion: string | null;
  secondary_emotions: string[] | null;
  intensity: string | null;
  topic: string | null;
  underlying_concern: string | null;
  summary: string | null;
  prompt_used: string | null;
  created_at: string;
}

export interface ReflectionTurnContext {
  turnNumber: number;
  sessionStartMood?: DetectedMood | string | null;
  awaitingFeelingCheckIn?: boolean;
}

export interface AnalyzeReflectionResponse {
  primaryEmotion: string;
  secondaryEmotions: string[];
  detectedMood: DetectedMood;
  moodTrend: MoodTrend;
  intensity: string;
  topic: string;
  underlyingConcern: string;
  userFacingInsight: string;
  nextPrompt: string;
  userSoundsMoreOptimistic: boolean;
  shouldAskFeelingBetter: boolean;
  readyToWrapUp: boolean;
}

export interface GenerateSummaryResponse {
  summary: string;
  keyEmotion: string;
  keyConcern: string;
  suggestedNextPrompt: string;
  detectedMood: DetectedMood;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
