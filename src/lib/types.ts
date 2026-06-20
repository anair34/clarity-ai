export type InitialMood = "Great" | "Good" | "Okay" | "Bad" | "Terrible";

export type FinalMood =
  | "Much better"
  | "Better"
  | "About the same"
  | "Worse"
  | "Much worse";

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
  initial_mood: InitialMood | null;
  final_mood: FinalMood | null;
  primary_emotion: string | null;
  secondary_emotions: string[] | null;
  intensity: string | null;
  topic: string | null;
  underlying_concern: string | null;
  summary: string | null;
  prompt_used: string | null;
  created_at: string;
}

export interface AnalyzeReflectionResponse {
  primaryEmotion: string;
  secondaryEmotions: string[];
  moodScore: InitialMood;
  intensity: string;
  topic: string;
  underlyingConcern: string;
  userFacingInsight: string;
  nextPrompt: string;
}

export interface GenerateSummaryResponse {
  summary: string;
  keyEmotion: string;
  keyConcern: string;
  suggestedNextPrompt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
