import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_MEMORY_SESSIONS = 8;
export const MAX_USER_MESSAGES_PER_SESSION = 4;
export const MAX_SNIPPET_CHARS = 180;

export interface MemoryMessage {
  role: string;
  content: string;
  created_at: string;
}

export interface MemorySession {
  id: string;
  created_at: string;
  topic: string | null;
  underlying_concern: string | null;
  primary_emotion: string | null;
  summary: string | null;
  initial_mood: string | null;
  final_mood: string | null;
  reflection_messages: MemoryMessage[] | null;
}

export function truncateMemoryText(text: string, max = MAX_SNIPPET_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function formatReflectionMemory(sessions: MemorySession[]): string {
  if (sessions.length === 0) return "";

  const blocks = sessions.map((session, index) => {
    const date = new Date(session.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const recency =
      index === 0 ? "most recent" : index === 1 ? "recent" : `${index + 1} sessions ago`;

    const headerParts = [`[${date}, ${recency}]`];
    if (session.topic) headerParts.push(`Topic: ${session.topic}`);
    if (session.underlying_concern) {
      headerParts.push(`Concern: ${session.underlying_concern}`);
    }
    if (session.primary_emotion) {
      headerParts.push(`Emotion: ${session.primary_emotion}`);
    }
    if (session.initial_mood || session.final_mood) {
      headerParts.push(
        `Mood: ${session.initial_mood ?? "?"} → ${session.final_mood ?? "?"}`
      );
    }

    const userMessages = (session.reflection_messages ?? [])
      .filter((message) => message.role === "user")
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .slice(-MAX_USER_MESSAGES_PER_SESSION)
      .map((message) => truncateMemoryText(message.content));

    const lines = [headerParts.join(" | ")];
    if (userMessages.length > 0) {
      lines.push(`User said: ${userMessages.map((m) => `"${m}"`).join(" | ")}`);
    }
    if (session.summary) {
      lines.push(`Summary: ${truncateMemoryText(session.summary, 240)}`);
    }

    return lines.join("\n");
  });

  return blocks.join("\n\n");
}

export async function fetchReflectionMemory(
  supabase: SupabaseClient,
  userId: string,
  excludeSessionId: string
): Promise<string> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("reflection_sessions")
    .select(
      `
      id,
      created_at,
      topic,
      underlying_concern,
      primary_emotion,
      summary,
      initial_mood,
      final_mood
    `
    )
    .eq("user_id", userId)
    .neq("id", excludeSessionId)
    .order("created_at", { ascending: false })
    .limit(MAX_MEMORY_SESSIONS);

  if (sessionsError || !sessions?.length) return "";

  const sessionIds = sessions.map((session) => session.id);
  const { data: messages, error: messagesError } = await supabase
    .from("reflection_messages")
    .select("session_id, role, content, created_at")
    .in("session_id", sessionIds)
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (messagesError) {
    return formatReflectionMemory(sessions as MemorySession[]);
  }

  const messagesBySession = new Map<string, MemoryMessage[]>();
  for (const message of messages ?? []) {
    const bucket = messagesBySession.get(message.session_id) ?? [];
    bucket.push({
      role: message.role,
      content: message.content,
      created_at: message.created_at,
    });
    messagesBySession.set(message.session_id, bucket);
  }

  const sessionsWithMessages = sessions.map((session) => ({
    ...session,
    reflection_messages: messagesBySession.get(session.id) ?? [],
  }));

  return formatReflectionMemory(sessionsWithMessages as MemorySession[]);
}
