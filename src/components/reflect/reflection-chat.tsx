"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FINAL_MOODS, FOLLOW_UP_PROMPT_COUNT } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type {
  AnalyzeReflectionResponse,
  ChatMessage,
  FinalMood,
  GenerateSummaryResponse,
  InitialMood,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ReflectionChatProps {
  sessionId: string;
  initialMood: InitialMood;
  onComplete: () => void;
  onRestart: () => void;
}

type Phase = "chat" | "final-mood" | "summary";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  insight?: string;
}

export function ReflectionChat({
  sessionId,
  initialMood,
  onComplete,
  onRestart,
}: ReflectionChatProps) {
  const [phase, setPhase] = useState<Phase>("chat");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [assistantCount, setAssistantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinalMood, setSelectedFinalMood] = useState<FinalMood | null>(
    null
  );
  const [summary, setSummary] = useState<GenerateSummaryResponse | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, phase]);

  useEffect(() => {
    async function analyzeFirstMessage() {
      try {
        const supabase = createClient();
        const { data: dbMessages } = await supabase
          .from("reflection_messages")
          .select("role, content")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        const firstUserMessage = dbMessages?.find((m) => m.role === "user");
        if (!firstUserMessage) throw new Error("No check-in message found");

        const history: ChatMessage[] = [];
        const response = await fetch("/api/analyze-reflection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userMessage: firstUserMessage.content,
            messageHistory: history,
          }),
        });

        if (!response.ok) throw new Error("Failed to analyze reflection");

        const analysis = (await response.json()) as AnalyzeReflectionResponse;

        await supabase.from("reflection_messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: `${analysis.userFacingInsight}\n\n${analysis.nextPrompt}`,
        });

        setMessages([
          { role: "user", content: firstUserMessage.content },
          {
            role: "assistant",
            content: analysis.nextPrompt,
            insight: analysis.userFacingInsight,
          },
        ]);
        setAssistantCount(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    analyzeFirstMessage();
  }, [sessionId]);

  async function sendMessage() {
    if (!input.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    const userMessage = input.trim();
    setInput("");

    const updatedMessages: DisplayMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);

    try {
      const supabase = createClient();

      await supabase.from("reflection_messages").insert({
        session_id: sessionId,
        role: "user",
        content: userMessage,
      });

      const messageHistory: ChatMessage[] = updatedMessages.map((m) => ({
        role: m.role,
        content: m.insight ? `${m.insight}\n\n${m.content}` : m.content,
      }));

      if (assistantCount >= FOLLOW_UP_PROMPT_COUNT) {
        setPhase("final-mood");
        return;
      }

      const response = await fetch("/api/analyze-reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userMessage,
          messageHistory: messageHistory.slice(0, -1),
        }),
      });

      if (!response.ok) throw new Error("Failed to get follow-up prompt");

      const analysis = (await response.json()) as AnalyzeReflectionResponse;

      await supabase.from("reflection_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: `${analysis.userFacingInsight}\n\n${analysis.nextPrompt}`,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: analysis.nextPrompt,
          insight: analysis.userFacingInsight,
        },
      ]);
      setAssistantCount((count) => count + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function finishSession() {
    if (!selectedFinalMood) return;

    setSubmitting(true);
    setError(null);

    try {
      const chatMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.insight ? `${m.insight}\n\n${m.content}` : m.content,
      }));

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages: chatMessages,
          initialMood,
          finalMood: selectedFinalMood,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const summaryData = (await response.json()) as GenerateSummaryResponse;
      setSummary(summaryData);
      setPhase("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "summary" && summary) {
    return (
      <Card className="mx-auto max-w-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Your reflection summary</CardTitle>
          <CardDescription>
            You started feeling {initialMood.toLowerCase()}. Here&apos;s what
            stood out from this session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed text-foreground/90">{summary.summary}</p>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="text-sm font-medium">A question to carry forward</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.suggestedNextPrompt}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onComplete}>Done</Button>
            <Button variant="outline" onClick={onRestart}>
              Reflect again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "final-mood") {
    return (
      <Card className="mx-auto max-w-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Compared to when you started, how do you feel now?</CardTitle>
          <CardDescription>
            This helps Clarity track whether reflection is helping you feel
            better over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            {FINAL_MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => setSelectedFinalMood(mood)}
                className={cn(
                  "rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-all hover:bg-muted",
                  selectedFinalMood === mood &&
                    "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2"
                )}
              >
                {mood}
              </button>
            ))}
          </div>
          <Button
            onClick={finishSession}
            disabled={!selectedFinalMood || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finish reflection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="mb-4 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Reflection</h1>
        <p className="text-sm text-muted-foreground">
          Question {Math.min(assistantCount, FOLLOW_UP_PROMPT_COUNT)} of{" "}
          {FOLLOW_UP_PROMPT_COUNT}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Reading your check-in...
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {message.insight && (
                  <p className="mb-2 text-foreground/80 italic">
                    {message.insight}
                  </p>
                )}
                <p>{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {!loading && (
        <div className="mt-4 flex gap-2">
          <Textarea
            placeholder="Share what's on your mind..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={submitting || !input.trim()}
            className="shrink-0 self-end"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
