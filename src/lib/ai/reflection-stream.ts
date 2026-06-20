import { MIN_TURNS_BEFORE_CHECK_IN } from "@/lib/constants";
import type {
  AnalyzeReflectionResponse,
  ChatMessage,
  ReflectionTurnContext,
} from "@/lib/types";

/** Pull a possibly-incomplete JSON string value while the model is still streaming. */
export function extractPartialJsonString(json: string, key: string): string {
  const keyToken = `"${key}"`;
  const keyIndex = json.indexOf(keyToken);
  if (keyIndex === -1) return "";

  const colon = json.indexOf(":", keyIndex + keyToken.length);
  if (colon === -1) return "";

  let i = colon + 1;
  while (i < json.length && /\s/.test(json[i])) i += 1;
  if (json[i] !== '"') return "";

  i += 1;
  let result = "";
  while (i < json.length) {
    const char = json[i];
    if (char === "\\" && i + 1 < json.length) {
      const next = json[i + 1];
      if (next === "n") result += "\n";
      else if (next === "t") result += "\t";
      else result += next;
      i += 2;
      continue;
    }
    if (char === '"') break;
    result += char;
    i += 1;
  }

  return result;
}

export function buildDisplayFromPartialJson(buffer: string): string {
  const insight = extractPartialJsonString(buffer, "userFacingInsight");
  const question = extractPartialJsonString(buffer, "nextPrompt");

  if (insight && question) return `${insight}\n\n${question}`;
  if (insight) return insight;
  return question;
}

export function buildReflectionUserPrompt(
  userMessage: string,
  messageHistory: ChatMessage[],
  memoryContext?: string,
  turnContext?: ReflectionTurnContext
): string {
  const historyText = (messageHistory ?? [])
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const parts: string[] = [];
  const turnNumber = turnContext?.turnNumber ?? 1;

  parts.push(
    `Assistant turn: ${turnNumber} (no fixed limit — continue until readyToWrapUp or user feels better).`
  );
  parts.push(
    `Minimum turns before a feeling-better check-in: ${MIN_TURNS_BEFORE_CHECK_IN}.`
  );

  if (turnContext?.sessionStartMood) {
    parts.push(`Mood at session start (AI-detected): ${turnContext.sessionStartMood}`);
  }

  if (turnContext?.awaitingFeelingCheckIn) {
    parts.push(
      "The user's latest message is a reply to your feeling-better check-in. Interpret whether they feel better than when the session started."
    );
  }

  if (memoryContext?.trim()) {
    parts.push(
      `Context from past reflections (most recent first — use only when naturally relevant):\n${memoryContext.trim()}`
    );
  }

  parts.push(`Conversation so far:\n${historyText || "(just starting)"}`);
  parts.push(`Latest user message:\n${userMessage}`);

  return parts.join("\n\n");
}

export function splitAssistantDisplay(
  analysis: AnalyzeReflectionResponse
): { insight: string; content: string; full: string } {
  const insight = analysis.userFacingInsight;
  const content = analysis.nextPrompt;
  return {
    insight,
    content,
    full: `${insight}\n\n${content}`,
  };
}
