import { vi } from "vitest";

const openaiHoisted = vi.hoisted(() => ({
  mockOpenAICreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: openaiHoisted.mockOpenAICreate,
      },
    };
  },
}));

export const mockOpenAICreate = openaiHoisted.mockOpenAICreate;
