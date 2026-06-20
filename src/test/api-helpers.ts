import { vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { mockUser } from "@/test/helpers";

export function mockReflectionSupabase(options?: {
  user?: typeof mockUser | null;
  session?: { id: string; initial_mood?: string | null } | null;
  pastSessions?: unknown[];
  updateError?: boolean;
}) {
  const user = options?.user === undefined ? mockUser : options.user;
  const session =
    options?.session === undefined
      ? { id: "session-123", initial_mood: null }
      : options.session;

  const pastSessions = options?.pastSessions ?? [];

  const updateEq = vi.fn().mockResolvedValue({
    error: options?.updateError ? { message: "update failed" } : null,
  });

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: pastSessions, error: null }),
    single: vi.fn().mockResolvedValue({
      data: session,
      error: session ? null : { message: "Not found" },
    }),
    update: vi.fn().mockReturnValue({ eq: updateEq }),
  };

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue(chain),
  } as never);

  return { chain, updateEq };
}

export function mockPromptSupabase(options?: {
  user?: typeof mockUser | null;
  insertError?: boolean;
}) {
  const user = options?.user === undefined ? mockUser : options.user;
  const insert = vi.fn().mockResolvedValue({
    error: options?.insertError ? { message: "insert failed" } : null,
  });

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue({ insert }),
  } as never);

  return { insert };
}

export async function callAnalyzeReflection(body: unknown) {
  const { POST } = await import("@/app/api/analyze-reflection/route");
  return POST(
    new Request("http://localhost/api/analyze-reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function callGenerateSummary(body: unknown) {
  const { POST } = await import("@/app/api/generate-summary/route");
  return POST(
    new Request("http://localhost/api/generate-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function callGeneratePrompt(body: unknown) {
  const { POST } = await import("@/app/api/generate-prompt/route");
  return POST(
    new Request("http://localhost/api/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}
