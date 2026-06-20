"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brain, Leaf, LogOut } from "lucide-react";
import { ClarityLogo } from "@/components/clarity-logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/reflect", label: "Reflect", icon: Leaf },
  { href: "/insights", label: "My Dashboard", icon: Brain },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3 sm:px-4">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-3xl items-center gap-1 rounded-full border border-white/25",
          "bg-linear-to-r from-[#5a7d60]/88 via-[#4d6e53]/90 to-[#3f5a42]/92",
          "px-2 py-1.5 pl-2.5 shadow-[0_8px_32px_oklch(0.35_0.06_145/0.25)]",
          "backdrop-blur-xl backdrop-saturate-150 sm:gap-2 sm:px-3 sm:py-2 sm:pl-3"
        )}
      >
        <Link
          href="/reflect"
          className="flex shrink-0 items-center gap-2 rounded-full py-1 pr-2 pl-0.5 transition-opacity hover:opacity-90"
        >
          <ClarityLogo size="sm" className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="text-ui tracking-[-0.02em] text-white/95 sm:text-[15px]">
            clarity
          </span>
        </Link>

        <div className="mx-1 hidden h-5 w-px shrink-0 bg-white/20 sm:block" />

        <nav className="flex min-w-0 flex-1 items-center justify-end gap-0.5 sm:justify-center sm:gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3.5 sm:py-2 sm:text-sm",
                  active
                    ? "bg-white/20 text-white shadow-sm ring-1 ring-white/20"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-0.5 hidden h-5 w-px shrink-0 bg-white/20 sm:block" />

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-white/75 transition-all hover:bg-white/10 hover:text-white sm:px-3 sm:py-2 sm:text-sm"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden md:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
