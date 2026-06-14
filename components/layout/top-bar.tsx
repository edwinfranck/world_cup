import Link from "next/link";
import { Search, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageDropdown } from "@/components/language-dropdown";
import { TeamBanner } from "@/components/layout/team-banner";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-3 py-2.5 sm:px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-none bg-primary text-primary-foreground">
            <Trophy size={18} />
          </span>
          <span className="text-base font-extrabold tracking-tight">
            Mondial<span className="text-primary"> 26</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Recherche"
            className="grid h-9 w-9 place-items-center rounded-none border border-border bg-surface-2 text-foreground transition-colors hover:text-primary"
          >
            <Search size={18} />
          </Link>
          <LanguageDropdown />
          <ThemeToggle />
        </div>
      </div>
      <TeamBanner />
    </header>
  );
}
