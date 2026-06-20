"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_MOODS, MOOD_COLORS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { InitialMood } from "@/lib/types";
import { ReflectionChat } from "./reflection-chat";

export function ReflectPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const starterPrompt = searchParams.get("prompt") ?? "";

  const [phase, setPhase] = useState<"checkin" | "session" | "complete">(
    "checkin"
  );
  const [selectedMood, setSelectedMood] = useState<InitialMood | null>(null);
  const [checkInText, setCheckInText] = useState(starterPrompt);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMood, setInitialMood] = useState<InitialMood | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession() {
    if (!selectedMood || !checkInText.trim()) {
      setError("Please select a mood and write a short check-in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: session, error: sessionError } = await supabase
        .from("reflection_sessions")
        .insert({
          user_id: user.id,
          initial_mood: selectedMood,
          prompt_used: starterPrompt || null,
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
          content: checkInText.trim(),
        });

      if (messageError) throw new Error(messageError.message);

      setSessionId(session.id);
      setInitialMood(selectedMood);
      setPhase("session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "session" && sessionId && initialMood) {
    return (
      <ReflectionChat
        sessionId={sessionId}
        initialMood={initialMood}
        onComplete={() => setPhase("complete")}
        onRestart={() => {
          setPhase("checkin");
          setSessionId(null);
          setSelectedMood(null);
          setCheckInText("");
          router.replace("/reflect");
        }}
      />
    );
  }

  if (phase === "complete") {
    return (
      <Card className="mx-auto max-w-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Reflection complete</CardTitle>
          <CardDescription>
            Nice work taking time to reflect. Your session has been saved to
            Insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/insights" className={cn(buttonVariants())}>
            View Insights
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              setPhase("checkin");
              setSessionId(null);
              setSelectedMood(null);
              setCheckInText("");
              router.replace("/reflect");
            }}
          >
            Start another reflection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How are you feeling right now?
        </h1>
        <p className="text-muted-foreground">
          Choose a starting mood, then write freely about what&apos;s on your
          mind.
        </p>
      </div>

      <Alert className="border-border/60 bg-muted/40">
        <AlertDescription className="text-sm text-muted-foreground">
          Clarity is a self-reflection tool, not a substitute for professional
          mental health care. If you&apos;re in crisis, please contact a
          trusted person or local emergency resources.
        </AlertDescription>
      </Alert>

      {starterPrompt && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-primary">Starting prompt</p>
            <p className="mt-1 text-sm text-muted-foreground">{starterPrompt}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <Label>Starting mood</Label>
            <div className="flex flex-wrap gap-2">
              {INITIAL_MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    MOOD_COLORS[mood],
                    selectedMood === mood && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="checkin">Your check-in</Label>
            <Textarea
              id="checkin"
              placeholder="I feel really anxious and behind. I keep thinking everyone else is doing better than me."
              value={checkInText}
              onChange={(e) => setCheckInText(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <Button
            onClick={startSession}
            disabled={loading || !selectedMood || !checkInText.trim()}
            className="w-full sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Begin reflection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
