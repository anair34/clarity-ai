import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFLECTION_SYSTEM_PROMPT } from "@/lib/ai/system-prompts";
import {
  callAnalyzeReflection,
  mockReflectionSupabase,
} from "@/test/api-helpers";
import { mockAnalysis, mockUser, readJson } from "@/test/helpers";
import { mockOpenAICreate } from "@/test/setup-openai";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const validBody = {
  sessionId: "session-123",
  userMessage: "I feel stressed about recruiting",
  messageHistory: [] as { role: "user" | "assistant"; content: string }[],
};

describe("POST /api/analyze-reflection auth and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockAnalysis) } }],
    });
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns 401 when user is not authenticated", async () => {
    mockReflectionSupabase({ user: null });
    const response = await callAnalyzeReflection(validBody);
    expect(response.status).toBe(401);
    expect(mockOpenAICreate).not.toHaveBeenCalled();
  });

  it.each([
    ["missing sessionId", { userMessage: "hello", messageHistory: [] }],
    ["missing userMessage", { sessionId: "session-123", messageHistory: [] }],
    ["empty userMessage", { sessionId: "session-123", userMessage: "", messageHistory: [] }],
    ["whitespace userMessage", { sessionId: "session-123", userMessage: "   ", messageHistory: [] }],
    ["null sessionId", { sessionId: null, userMessage: "hello", messageHistory: [] }],
  ])("returns 400 for %s", async (_label, body) => {
    mockReflectionSupabase();
    const response = await callAnalyzeReflection(body);
    expect(response.status).toBe(400);
  });

  it("returns 404 when session does not belong to user", async () => {
    mockReflectionSupabase({ session: null });
    const response = await callAnalyzeReflection(validBody);
    expect(response.status).toBe(404);
  });

  it("returns 500 for invalid JSON body", async () => {
    mockReflectionSupabase();
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/analyze-reflection", {
        method: "POST",
        body: "{not-json",
      })
    );
    expect(response.status).toBe(500);
  });
});

describe("POST /api/analyze-reflection success path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(mockAnalysis) } }],
    });
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns analysis JSON on success", async () => {
    mockReflectionSupabase();
    const response = await callAnalyzeReflection(validBody);
    const body = await readJson<typeof mockAnalysis>(response);
    expect(response.status).toBe(200);
    expect(body.nextPrompt).toBe(mockAnalysis.nextPrompt);
  });

  it("uses gpt-4o-mini with JSON response format", async () => {
    mockReflectionSupabase();
    await callAnalyzeReflection(validBody);
    expect(mockOpenAICreate.mock.calls[0][0].model).toBe("gpt-4o-mini");
    expect(mockOpenAICreate.mock.calls[0][0].response_format).toEqual({
      type: "json_object",
    });
  });

  it("includes the reflection system prompt", async () => {
    mockReflectionSupabase();
    await callAnalyzeReflection(validBody);
    const messages = mockOpenAICreate.mock.calls[0][0].messages;
    expect(messages[0].content).toBe(REFLECTION_SYSTEM_PROMPT);
  });

  it("passes prior message history into the model prompt", async () => {
    mockReflectionSupabase();
    await callAnalyzeReflection({
      ...validBody,
      messageHistory: [
        { role: "user", content: "First message" },
        { role: "assistant", content: "First question" },
      ],
    });
    const userContent = mockOpenAICreate.mock.calls[0][0].messages[1].content;
    expect(userContent).toContain("User: First message");
    expect(userContent).toContain("Assistant: First question");
  });

  it("persists extracted emotions and initial detected mood to the session row", async () => {
    const { chain, updateEq } = mockReflectionSupabase({
      session: { id: "session-123", initial_mood: null },
    });
    await callAnalyzeReflection(validBody);
    expect(chain.update).toHaveBeenCalledWith({
      primary_emotion: mockAnalysis.primaryEmotion,
      secondary_emotions: mockAnalysis.secondaryEmotions,
      intensity: mockAnalysis.intensity,
      topic: mockAnalysis.topic,
      underlying_concern: mockAnalysis.underlyingConcern,
      initial_mood: mockAnalysis.detectedMood,
    });
    expect(updateEq).toHaveBeenCalledWith("id", "session-123");
  });

  it("does not overwrite an existing initial mood", async () => {
    const { chain } = mockReflectionSupabase({
      session: { id: "session-123", initial_mood: "Sad" },
    });
    await callAnalyzeReflection(validBody);
    expect(chain.update).toHaveBeenCalledWith({
      primary_emotion: mockAnalysis.primaryEmotion,
      secondary_emotions: mockAnalysis.secondaryEmotions,
      intensity: mockAnalysis.intensity,
      topic: mockAnalysis.topic,
      underlying_concern: mockAnalysis.underlyingConcern,
    });
  });

  it("scopes session lookup to the authenticated user", async () => {
    const { chain } = mockReflectionSupabase();
    await callAnalyzeReflection(validBody);
    expect(chain.eq).toHaveBeenCalledWith("user_id", mockUser.id);
  });
});

describe("POST /api/analyze-reflection OpenAI failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns 500 when OpenAI returns empty content", async () => {
    mockReflectionSupabase();
    mockOpenAICreate.mockResolvedValue({ choices: [{ message: {} }] });
    const response = await callAnalyzeReflection(validBody);
    expect(response.status).toBe(500);
  });

  it("returns 500 when OpenAI throws", async () => {
    mockReflectionSupabase();
    mockOpenAICreate.mockRejectedValue(new Error("rate limited"));
    const response = await callAnalyzeReflection(validBody);
    expect(response.status).toBe(500);
  });

  it("returns 500 when OpenAI returns invalid JSON", async () => {
    mockReflectionSupabase();
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: "not-json" } }],
    });
    const response = await callAnalyzeReflection(validBody);
    expect(response.status).toBe(500);
  });
});
