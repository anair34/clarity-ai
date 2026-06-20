import { describe, expect, it } from "vitest";
import {
  formatReflectionMemory,
  truncateMemoryText,
  type MemorySession,
} from "@/lib/reflection-memory";

function makeMemorySession(
  overrides: Partial<MemorySession> = {}
): MemorySession {
  return {
    id: "session-1",
    created_at: "2026-06-18T10:00:00.000Z",
    topic: "Career",
    underlying_concern: "BCG recruiting",
    primary_emotion: "Anxiety",
    summary: "You explored stress about consulting interviews.",
    initial_mood: "Frustrated",
    final_mood: "Sad",
    reflection_messages: [
      {
        role: "user",
        content: "I'm frustrated about the BCG process",
        created_at: "2026-06-18T10:01:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("truncateMemoryText", () => {
  it("returns short text unchanged", () => {
    expect(truncateMemoryText("BCG interviews")).toBe("BCG interviews");
  });

  it("truncates long text with an ellipsis", () => {
    const long = "a".repeat(200);
    expect(truncateMemoryText(long)).toHaveLength(180);
    expect(truncateMemoryText(long).endsWith("…")).toBe(true);
  });
});

describe("formatReflectionMemory", () => {
  it("returns an empty string for no sessions", () => {
    expect(formatReflectionMemory([])).toBe("");
  });

  it("includes topic, concern, user quotes, and summary", () => {
    const formatted = formatReflectionMemory([makeMemorySession()]);
    expect(formatted).toContain("Topic: Career");
    expect(formatted).toContain("Concern: BCG recruiting");
    expect(formatted).toContain("BCG process");
    expect(formatted).toContain("consulting interviews");
    expect(formatted).toContain("most recent");
  });

  it("orders sessions with the first entry marked most recent", () => {
    const formatted = formatReflectionMemory([
      makeMemorySession({
        id: "new",
        created_at: "2026-06-19T10:00:00.000Z",
        topic: "Stress",
      }),
      makeMemorySession({
        id: "old",
        created_at: "2026-06-10T10:00:00.000Z",
        topic: "Identity",
      }),
    ]);

    expect(formatted.indexOf("Topic: Stress")).toBeLessThan(
      formatted.indexOf("Topic: Identity")
    );
    expect(formatted).toContain("most recent");
    expect(formatted).toContain("recent");
  });

  it("only includes user messages from past sessions", () => {
    const formatted = formatReflectionMemory([
      makeMemorySession({
        reflection_messages: [
          {
            role: "user",
            content: "I feel behind on recruiting",
            created_at: "2026-06-18T10:01:00.000Z",
          },
          {
            role: "assistant",
            content: "What part feels hardest?",
            created_at: "2026-06-18T10:02:00.000Z",
          },
        ],
      }),
    ]);

    expect(formatted).toContain("recruiting");
    expect(formatted).not.toContain("What part feels hardest?");
  });
});
