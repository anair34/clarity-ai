import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to continue your reflection journey."
      >
        <LoginForm />
      </AuthShell>
    </main>
  );
}
