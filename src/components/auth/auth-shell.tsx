import Link from "next/link";
import { ClarityLogo } from "@/components/clarity-logo";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  className,
}: AuthShellProps) {
  return (
    <div className={cn("w-full max-w-lg", className)}>
      <div className="mb-10 text-center">
        <Link
          href="/"
          className="mx-auto inline-flex transition-opacity hover:opacity-90"
        >
          <ClarityLogo size="lg" />
        </Link>
        <h1 className="text-hero mt-8">{title}</h1>
        <p className="text-subtitle mx-auto mt-5 max-w-md">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
