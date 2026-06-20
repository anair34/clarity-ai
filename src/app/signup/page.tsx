import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
      <AuthShell
        title="Create your account"
        subtitle="Start reflecting with a private, guided journaling space."
      >
        <SignupForm initialEmail={email ?? ""} />
      </AuthShell>
    </main>
  );
}
