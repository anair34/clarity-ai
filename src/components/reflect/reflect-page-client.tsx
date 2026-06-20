"use client";

import { useSearchParams } from "next/navigation";
import { ReflectionChat } from "./reflection-chat";

export function ReflectPageClient() {
  const searchParams = useSearchParams();
  const starterPrompt = searchParams.get("prompt") ?? "";

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-2xl flex-col pt-10 sm:pt-14">
      <div className="mb-6 shrink-0 space-y-1.5">
        <h1 className="text-page-title">Reflect</h1>
        <p className="text-base leading-snug text-muted-foreground whitespace-nowrap">
          Tell Clarity about your day — the conversation continues until you feel better or are ready to wrap up.
        </p>
      </div>
      <ReflectionChat starterPrompt={starterPrompt} className="min-h-0 flex-1" />
    </div>
  );
}
