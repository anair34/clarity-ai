import Link from "next/link";
import { redirect } from "next/navigation";
import { ClarityLogo } from "@/components/clarity-logo";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/reflect");

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <ClarityLogo size="md" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Move from confusion to clarity
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Clarity is an AI-powered reflection app that helps you understand
            how you feel, explore what might be behind it, and track whether
            writing actually helps.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Get started
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Sign in
            </Link>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            A self-reflection tool — not a substitute for professional mental
            health care.
          </p>
        </div>
      </div>
    </main>
  );
}
