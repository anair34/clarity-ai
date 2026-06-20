import type { ReflectionSession } from "@/lib/types";

export function makeSession(
  overrides: Partial<ReflectionSession> = {}
): ReflectionSession {
  return {
    id: "session-1",
    user_id: "user-1",
    initial_mood: "Sad",
    final_mood: "Happy",
    primary_emotion: "Anxiety",
    secondary_emotions: ["Stress"],
    intensity: "Medium",
    topic: "Career",
    underlying_concern: "Deadlines",
    summary: "A helpful reflection.",
    prompt_used: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function postJson(
  path: string,
  body: unknown
): Promise<Response> {
  return fetch(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
