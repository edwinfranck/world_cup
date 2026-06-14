"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, MoreHorizontal, Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const ITEMS = [
  { href: "/", key: "nav.home", icon: Home },
  { href: "/fixtures", key: "nav.matches", icon: CalendarDays },
  { href: "/predictions", key: "nav.predictions", icon: Target },
  { href: "/bracket", key: "nav.simulator", icon: Trophy },
  { href: "/more", key: "nav.more", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ href, key, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted hover:text-foreground"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
