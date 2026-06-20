"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { splitAssistantDisplay } from "@/lib/ai/reflection-stream";
import {
  MAX_REFLECTION_TURNS,
  MIN_REFLECTION_WORDS,
} from "@/lib/constants";
import { countWords } from "@/lib/word-count";
import type { DetectedMood } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type {
  AnalyzeReflectionResponse,
  ChatMessage,
  GenerateSummaryResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReflectionChatProps {
  starterPrompt?: string;
  className?: string;
}

type Phase = "chat" | "summary";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  insight?: string;
  isWelcome?: boolean;
  isStreaming?: boolean;
}

const WELCOME_MESSAGE = "How are you feeling today? Tell me about your day!";

function FeelingLuckyButton({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex justify-start">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={disabled || loading}
        className="rounded-full border-primary/30 bg-card text-sm shadow-sm hover:bg-primary/5"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4 text-primary" />
        )}
        I&apos;m feeling lucky
      </Button>
    </div>
  );
}

function toChatHistory(messages: DisplayMessage[]): ChatMessage[] {
  return messages
    .filter((message) => !message.isWelcome && !message.isStreaming)
    .map((message) => ({
      role: message.role,
      content: message.insight
        ? `${message.insight}\n\n${message.content}`
        : message.content,
    }));
}

function ChatBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {message.insight && !message.isStreaming && (
          <p className="mb-2 text-foreground/80 italic">{message.insight}</p>
        )}
        <p>
          {message.content}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-foreground/50 align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}

async function consumeReflectionStream(
  response: Response,
  onText: (text: string) => void
): Promise<AnalyzeReflectionResponse> {
  if (!response.body) {
    throw new Error("Failed to analyze reflection");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let analysis: AnalyzeReflectionResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = JSON.parse(line.slice(6)) as {
        type: string;
        text?: string;
        analysis?: AnalyzeReflectionResponse;
        error?: string;
      };

      if (payload.type === "text" && payload.text) {
        onText(payload.text);
      } else if (payload.type === "done" && payload.analysis) {
        analysis = payload.analysis;
      } else if (payload.type === "error") {
        throw new Error(payload.error ?? "Failed to analyze reflection");
      }
    }
  }

  if (!analysis) {
    throw new Error("Failed to analyze reflection");
  }

  return analysis;
}

export function ReflectionChat({ starterPrompt = "", className }: ReflectionChatProps) {
  const router = useRouter();
  const [activePrompt, setActivePrompt] = useState(starterPrompt);
  const [luckyLoading, setLuckyLoading] = useState(false);

  const [phase, setPhase] = useState<Phase>("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: "assistant", content: WELCOME_MESSAGE, isWelcome: true },
  ]);
  const [input, setInput] = useState("");
  const [assistantCount, setAssistantCount] = useState(0);
  const [sessionStartMood, setSessionStartMood] = useState<DetectedMood | null>(
    null
  );
  const [awaitingFeelingCheckIn, setAwaitingFeelingCheckIn] = useState(false);
  const [awaitingAssistant, setAwaitingAssistant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keepWritingNudgeAt, setKeepWritingNudgeAt] = useState<number | null>(null);
  const [summary, setSummary] = useState<GenerateSummaryResponse | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, awaitingAssistant, phase, summary]);

  useEffect(() => {
    if (!starterPrompt) return;
    setActivePrompt(starterPrompt);
    setMessages([
      { role: "assistant", content: WELCOME_MESSAGE, isWelcome: true },
      {
        role: "assistant",
        content: `Here's something to reflect on:\n\n"${starterPrompt}"`,
      },
    ]);
  }, [starterPrompt]);

  useEffect(() => {
    if (!keepWritingNudgeAt) return;
    const timeout = setTimeout(() => setKeepWritingNudgeAt(null), 3500);
    return () => clearTimeout(timeout);
  }, [keepWritingNudgeAt]);

  async function ensureSession(userMessage: string): Promise<string> {
    if (sessionId) return sessionId;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      throw new Error("Not authenticated");
    }

    const { data: session, error: sessionError } = await supabase
      .from("reflection_sessions")
      .insert({
        user_id: user.id,
        prompt_used: activePrompt || null,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      throw new Error(sessionError?.message ?? "Failed to create session");
    }

    const { error: messageError } = await supabase
      .from("reflection_messages")
      .insert({
        session_id: session.id,
        role: "user",
        content: userMessage,
      });

    if (messageError) throw new Error(messageError.message);

    setSessionId(session.id);
    return session.id;
  }

  async function finishSession(activeSessionId: string, history: ChatMessage[]) {
    setAwaitingAssistant(true);
    const response = await fetch("/api/generate-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: activeSessionId,
        messages: history,
      }),
    });

    if (!response.ok) throw new Error("Failed to generate summary");

    const summaryData = (await response.json()) as GenerateSummaryResponse;
    setSummary(summaryData);
    setPhase("summary");
  }

  async function handleFeelingLucky() {
    if (luckyLoading || submitting || awaitingAssistant) return;

    setLuckyLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "Random" }),
      });

      if (!response.ok) throw new Error("Failed to generate a prompt");

      const data = (await response.json()) as { prompt: string };
      setActivePrompt(data.prompt);
      setMessages([
        { role: "assistant", content: WELCOME_MESSAGE, isWelcome: true },
        {
          role: "assistant",
          content: `Here's something to reflect on:\n\n"${data.prompt}"`,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLuckyLoading(false);
    }
  }

  async function sendMessage(messageText?: string) {
    const userMessage = (messageText ?? input).trim();
    if (!userMessage || submitting || awaitingAssistant) return;

    const isFirstMessage = !messages.some((message) => message.role === "user");
    if (isFirstMessage) {
      const wordCount = countWords(userMessage);
      if (wordCount < MIN_REFLECTION_WORDS) {
        setKeepWritingNudgeAt(Date.now());
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setInput("");

    const updatedMessages: DisplayMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setAwaitingAssistant(true);

    const streamingIndex = updatedMessages.length;

    try {
      const activeSessionId = await ensureSession(userMessage);
      const history = toChatHistory(updatedMessages);
      const wasAwaitingCheckIn = awaitingFeelingCheckIn;

      if (assistantCount >= MAX_REFLECTION_TURNS) {
        await finishSession(activeSessionId, history);
        return;
      }

      const supabase = createClient();

      if (assistantCount > 0) {
        await supabase.from("reflection_messages").insert({
          session_id: activeSessionId,
          role: "user",
          content: userMessage,
        });
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", isStreaming: true },
      ]);

      const response = await fetch("/api/analyze-reflection/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          userMessage,
          messageHistory: history.slice(0, -1),
          turnContext: {
            turnNumber: assistantCount + 1,
            sessionStartMood,
            awaitingFeelingCheckIn: wasAwaitingCheckIn,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze reflection");
      }

      const analysis = await consumeReflectionStream(response, (text) => {
        setMessages((prev) =>
          prev.map((message, index) =>
            index === streamingIndex
              ? { ...message, content: text, isStreaming: true }
              : message
          )
        );
      });

      const { insight, content, full } = splitAssistantDisplay(analysis);

      await supabase.from("reflection_messages").insert({
        session_id: activeSessionId,
        role: "assistant",
        content: full,
      });

      const finalizedMessages: DisplayMessage[] = [
        ...updatedMessages,
        {
          role: "assistant",
          content,
          insight,
          isStreaming: false,
        },
      ];

      setMessages(finalizedMessages);
      setAssistantCount((count) => count + 1);

      if (!sessionStartMood) {
        setSessionStartMood(analysis.detectedMood);
      }

      if (analysis.shouldAskFeelingBetter) {
        setAwaitingFeelingCheckIn(true);
      } else if (wasAwaitingCheckIn) {
        setAwaitingFeelingCheckIn(false);
      }

      if (analysis.readyToWrapUp) {
        await finishSession(activeSessionId, toChatHistory(finalizedMessages));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((prev) => {
        const withoutStreaming = prev.filter((message) => !message.isStreaming);
        return withoutStreaming.slice(0, -1);
      });
      setInput(userMessage);
    } finally {
      setAwaitingAssistant(false);
      setSubmitting(false);
    }
  }

  function handleRestart() {
    setPhase("chat");
    setSessionId(null);
    setActivePrompt(starterPrompt);
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE, isWelcome: true }]);
    setInput("");
    setAssistantCount(0);
    setSessionStartMood(null);
    setAwaitingFeelingCheckIn(false);
    setAwaitingAssistant(false);
    setError(null);
    setSummary(null);
    router.replace(starterPrompt ? `/reflect?prompt=${encodeURIComponent(starterPrompt)}` : "/reflect");
  }

  const hasUserReplied = messages.some((message) => message.role === "user");
  const showFeelingLucky = !hasUserReplied && !awaitingAssistant;

  if (phase === "summary" && summary) {
    return (
      <div className={cn("flex flex-col animate-in fade-in duration-500", className)}>
        <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-4">
          {messages
            .filter((message) => !message.isWelcome)
            .map((message, index) => (
              <ChatBubble key={index} message={message} />
            ))}

          <div className="flex justify-start">
            <div className="max-w-[90%] space-y-4 rounded-2xl border border-border/60 bg-card px-4 py-4 text-sm leading-relaxed shadow-sm">
              <div>
                <p className="font-medium">Your reflection summary</p>
                <p className="mt-1 text-muted-foreground">
                  Overall mood: {summary.detectedMood}
                </p>
              </div>
              <p className="text-foreground/90">{summary.summary}</p>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="font-medium">For tomorrow</p>
                <p className="mt-1 text-muted-foreground">
                  {summary.suggestedNextPrompt}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/insights" className={cn(buttonVariants({ size: "sm" }))}>
                  My Dashboard
                </Link>
                <Button variant="outline" size="sm" onClick={handleRestart}>
                  Reflect again
                </Button>
              </div>
            </div>
          </div>
          <div ref={bottomRef} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {error && (
        <Alert variant="destructive" className="mb-3 shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))}
          {showFeelingLucky && (
            <FeelingLuckyButton
              onClick={() => void handleFeelingLucky()}
              loading={luckyLoading}
              disabled={submitting}
            />
          )}
          <div ref={bottomRef} />
        </div>

        <div className="relative border-t border-border/60 bg-card/80">
          {keepWritingNudgeAt && (
            <div
              key={keepWritingNudgeAt}
              role="status"
              className="absolute bottom-full left-3 right-14 z-10 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-300 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground shadow-lg"
            >
              Keep writing — share a bit more about your day before sending.
            </div>
          )}
          <div className="flex gap-2 p-3">
          <Textarea
            placeholder="Tell me about your day..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (keepWritingNudgeAt) setKeepWritingNudgeAt(null);
            }}
            rows={2}
            className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            disabled={awaitingAssistant}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
          />
          <Button
            size="icon"
            onClick={() => void sendMessage()}
            disabled={submitting || !input.trim() || awaitingAssistant}
            className="shrink-0 self-end rounded-full"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
