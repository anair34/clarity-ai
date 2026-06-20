"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROMPT_CATEGORIES } from "@/lib/constants";
import type { PromptCategory } from "@/lib/types";

export function PromptGenerator() {
  const [category, setCategory] = useState<PromptCategory>("Random");
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePrompt() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });

      if (!response.ok) throw new Error("Failed to generate prompt");

      const data = (await response.json()) as { prompt: string };
      setPrompt(data.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Reflection prompts
        </h1>
        <p className="text-muted-foreground">
          Not sure what to write about? Generate a thoughtful prompt to get
          started.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Choose a category</CardTitle>
          <CardDescription>
            Pick a theme, then generate a prompt tailored to it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as PromptCategory)}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generatePrompt} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Generate prompt
          </Button>

          {prompt && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm font-medium text-primary">Your prompt</p>
              <p className="mt-2 leading-relaxed">{prompt}</p>
              <Link
                href={`/reflect?prompt=${encodeURIComponent(prompt)}`}
                className={cn(buttonVariants(), "mt-4 inline-flex")}
              >
                Start reflection with this prompt
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
