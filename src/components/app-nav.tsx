"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brain, Leaf, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { ClarityLogo } from "@/components/clarity-logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/reflect", label: "Reflect", icon: Leaf },
  { href: "/insights", label: "Insights", icon: Brain },
  { href: "/prompts", label: "Prompts", icon: Menu },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/reflect" className="flex items-center gap-2.5">
            <ClarityLogo size="sm" />
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Clarity
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:inline-flex"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border/60 px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                    pathname === href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
