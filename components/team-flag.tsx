import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

const SIZES = { sm: 20, md: 28, lg: 40 } as const;

/**
 * Renders a team's flag: a crest image when the provider supplies one,
 * otherwise the emoji flag from the seed data.
 */
export function TeamFlag({
  team,
  size = "md",
  className,
}: {
  team: Pick<Team, "flag" | "crest" | "name">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  if (team.crest) {
    return (
      <Image
        src={team.crest}
        alt={team.name}
        width={px}
        height={px}
        className={cn("inline-block object-contain", className)}
        unoptimized
      />
    );
  }
  const fontSize = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-base";
  return (
    <span
      role="img"
      aria-label={team.name}
      className={cn("inline-block leading-none", fontSize, className)}
    >
      {team.flag}
    </span>
  );
}
