import { redirect } from "next/navigation";
import { ClarityLogo } from "@/components/clarity-logo";
import { HeroGetStarted } from "@/components/hero-get-started";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/reflect");

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-8 flex justify-center">
            <ClarityLogo size="xl" />
          </div>
          <h1 className="text-display">
            Move from confusion to clarity
          </h1>
          <p className="text-subtitle mx-auto mt-6 max-w-2xl">
            Clarity is an AI-powered reflection app that helps you understand
            how you feel, explore what might be behind it, and track whether
            writing actually helps.
          </p>
          <HeroGetStarted />
        </div>
      </div>
    </main>
  );
}
