import { beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_PROMPTS, PROMPT_CATEGORIES } from "@/lib/constants";
import {
  callGeneratePrompt,
  mockPromptSupabase,
} from "@/test/api-helpers";
import { mockUser, readJson } from "@/test/helpers";
import { mockOpenAICreate } from "@/test/setup-openai";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("POST /api/generate-prompt auth and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  it("returns 401 when user is not authenticated", async () => {
    mockPromptSupabase({ user: null });
    const response = await callGeneratePrompt({ category: "Career" });
    expect(response.status).toBe(401);
  });

  it.each([
    ["missing category", {}],
    ["empty category", { category: "" }],
    ["null category", { category: null }],
  ])("returns 400 for %s", async (_label, body) => {
    mockPromptSupabase();
    const response = await callGeneratePrompt(body);
    expect(response.status).toBe(400);
  });
});

describe("POST /api/generate-prompt fallback path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  it.each(PROMPT_CATEGORIES)(
    "returns a fallback prompt for category %s without OpenAI",
    async (category) => {
      mockPromptSupabase();
      const response = await callGeneratePrompt({ category });
      const body = await readJson<{ prompt: string }>(response);
      expect(response.status).toBe(200);
      expect(FALLBACK_PROMPTS[category]).toContain(body.prompt);
      expect(mockOpenAICreate).not.toHaveBeenCalled();
    }
  );

  it("records prompt history for fallback generation", async () => {
    const { insert } = mockPromptSupabase();
    const response = await callGeneratePrompt({ category: "Stress" });
    const body = await readJson<{ prompt: string }>(response);
    expect(insert).toHaveBeenCalledWith({
      user_id: mockUser.id,
      category: "Stress",
      prompt: body.prompt,
      used: false,
    });
  });
});

describe("POST /api/generate-prompt OpenAI path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("prefers OpenAI output when available", async () => {
    mockOpenAICreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              prompt: "What would a kinder version of today look like?",
            }),
          },
        },
      ],
    });
    mockPromptSupabase();
    const response = await callGeneratePrompt({ category: "Gratitude" });
    const body = await readJson<{ prompt: string }>(response);
    expect(response.status).toBe(200);
    expect(body.prompt).toBe("What would a kinder version of today look like?");
    expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
  });

  it("falls back when OpenAI throws", async () => {
    mockOpenAICreate.mockRejectedValue(new Error("quota exceeded"));
    mockPromptSupabase();
    const response = await callGeneratePrompt({ category: "Growth" });
    const body = await readJson<{ prompt: string }>(response);
    expect(response.status).toBe(200);
    expect(FALLBACK_PROMPTS.Growth).toContain(body.prompt);
  });

  it("falls back when OpenAI returns empty prompt field", async () => {
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ prompt: "" }) } }],
    });
    mockPromptSupabase();
    const response = await callGeneratePrompt({ category: "Identity" });
    const body = await readJson<{ prompt: string }>(response);
    expect(response.status).toBe(200);
    expect(FALLBACK_PROMPTS.Identity).toContain(body.prompt);
  });

  it("falls back when OpenAI returns invalid JSON", async () => {
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: "{" } }],
    });
    mockPromptSupabase();
    const response = await callGeneratePrompt({ category: "Confidence" });
    const body = await readJson<{ prompt: string }>(response);
    expect(response.status).toBe(200);
    expect(FALLBACK_PROMPTS.Confidence).toContain(body.prompt);
  });
});

describe("POST /api/generate-prompt request failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  it("returns 500 when prompt history insert fails", async () => {
    mockPromptSupabase({ insertError: true });
    const response = await callGeneratePrompt({ category: "Random" });
    expect(response.status).toBe(500);
  });
});
