import { beforeEach, describe, expect, it, vi } from "vitest";
import { SUMMARY_SYSTEM_PROMPT } from "@/lib/ai/system-prompts";
import { FINAL_MOODS } from "@/lib/constants";
import {
  callGenerateSummary,
  mockReflectionSupabase,
} from "@/test/api-helpers";
import { mockSummary, mockUser, readJson } from "@/test/helpers";
import { mockOpenAICreate } from "@/test/setup-openai";
import type { FinalMood, InitialMood } from "@/lib/types";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const baseBody = {
  sessionId: "session-123",
  messages: [
    { role: "user" as const, content: "I feel anxious" },
    { role: "assistant" as const, content: "What triggered that?" },
  ],
  initialMood: "Bad" as InitialMood,
  finalMood: "Better" as FinalMood,
};

describe("POST /api/generate-summary auth and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockSummary) } }],
    });
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns 401 when user is not authenticated", async () => {
    mockReflectionSupabase({ user: null });
    const response = await callGenerateSummary(baseBody);
    expect(response.status).toBe(401);
  });

  it.each([
    ["missing messages", { sessionId: "session-123", initialMood: "Bad", finalMood: "Better" }],
    ["missing initialMood", { sessionId: "session-123", messages: baseBody.messages, finalMood: "Better" }],
    ["missing finalMood", { sessionId: "session-123", messages: baseBody.messages, initialMood: "Bad" }],
    ["empty messages array", { ...baseBody, messages: [] }],
  ])("returns 400 for %s", async (_label, body) => {
    mockReflectionSupabase();
    const response = await callGenerateSummary(body);
    expect(response.status).toBe(400);
  });

  it("returns 404 when session is missing", async () => {
    mockReflectionSupabase({ session: null });
    const response = await callGenerateSummary(baseBody);
    expect(response.status).toBe(404);
  });
});

describe("POST /api/generate-summary success path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockSummary) } }],
    });
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns generated summary JSON", async () => {
    mockReflectionSupabase();
    const response = await callGenerateSummary(baseBody);
    const body = await readJson<typeof mockSummary>(response);
    expect(response.status).toBe(200);
    expect(body.summary).toBe(mockSummary.summary);
  });

  it.each(FINAL_MOODS)("accepts final mood option: %s", async (finalMood) => {
    mockReflectionSupabase();
    const response = await callGenerateSummary({ ...baseBody, finalMood });
    expect(response.status).toBe(200);
  });

  it("includes initial and final mood in the model prompt", async () => {
    mockReflectionSupabase();
    await callGenerateSummary(baseBody);
    const userContent = mockOpenAICreate.mock.calls[0][0].messages[1].content;
    expect(userContent).toContain("Initial mood: Bad");
    expect(userContent).toContain("Final mood (compared to start): Better");
  });

  it("uses the summary system prompt", async () => {
    mockReflectionSupabase();
    await callGenerateSummary(baseBody);
    expect(mockOpenAICreate.mock.calls[0][0].messages[0].content).toBe(
      SUMMARY_SYSTEM_PROMPT
    );
  });

  it("stores summary, emotion fields, and final mood", async () => {
    const { chain, updateEq } = mockReflectionSupabase();
    await callGenerateSummary(baseBody);
    expect(chain.update).toHaveBeenCalledWith({
      summary: mockSummary.summary,
      primary_emotion: mockSummary.keyEmotion,
      underlying_concern: mockSummary.keyConcern,
      final_mood: "Better",
    });
    expect(updateEq).toHaveBeenCalledWith("id", "session-123");
  });

  it("scopes session lookup to the authenticated user", async () => {
    const { chain } = mockReflectionSupabase();
    await callGenerateSummary(baseBody);
    expect(chain.eq).toHaveBeenCalledWith("user_id", mockUser.id);
  });
});

describe("POST /api/generate-summary OpenAI failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns 500 when OpenAI returns empty content", async () => {
    mockReflectionSupabase();
    mockOpenAICreate.mockResolvedValue({ choices: [{ message: {} }] });
    const response = await callGenerateSummary(baseBody);
    expect(response.status).toBe(500);
  });

  it("returns 500 when OpenAI throws", async () => {
    mockReflectionSupabase();
    mockOpenAICreate.mockRejectedValue(new Error("timeout"));
    const response = await callGenerateSummary(baseBody);
    expect(response.status).toBe(500);
  });
});
