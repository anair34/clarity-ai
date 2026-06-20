"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroGetStarted() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    const href = trimmed
      ? `/signup?email=${encodeURIComponent(trimmed)}`
      : "/signup";
    router.push(href);
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-xl">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border/60 bg-card/90 p-2 pl-5",
          "shadow-[0_8px_40px_oklch(0.35_0.04_145/0.12)] backdrop-blur-md",
          "transition-shadow focus-within:border-primary/30 focus-within:shadow-[0_8px_40px_oklch(0.35_0.06_145/0.18)]",
          "sm:pl-6"
        )}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
          aria-label="Email address"
        />
        <Button
          type="submit"
          size="lg"
          className="h-11 shrink-0 rounded-full px-5 text-base sm:px-6"
        >
          Get started
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </form>
      <p className="mt-5 text-center text-base text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
