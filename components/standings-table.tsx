import { TeamFlag } from "@/components/team-flag";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

/**
 * Group standings table. Top 2 positions are highlighted as qualifying;
 * position 3 is a possible best-third qualifier (8 of 12 advance at WC 2026).
 */
export function StandingsTable({ group }: { group: Group }) {
  return (
    <div className="overflow-hidden rounded-none border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase text-muted">
            <th className="px-2 py-2 text-left font-semibold">#</th>
            <th className="px-1 py-2 text-left font-semibold">Équipe</th>
            <th className="px-1 py-2 text-center font-semibold">J</th>
            <th className="px-1 py-2 text-center font-semibold">DB</th>
            <th className="px-2 py-2 text-center font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((s) => (
            <tr
              key={s.team.id}
              className="border-b border-border/60 last:border-0"
            >
              <td className="px-2 py-2">
                <span
                  className={cn(
                    "inline-block h-5 w-1 rounded-none align-middle",
                    s.position <= 2
                      ? "bg-primary"
                      : s.position === 3
                        ? "bg-gold"
                        : "bg-transparent"
                  )}
                />
                <span className="ml-1.5 tabular-nums text-muted">
                  {s.position}
                </span>
              </td>
              <td className="px-1 py-2">
                <div className="flex items-center gap-2">
                  <TeamFlag team={s.team} size="sm" />
                  <span className="truncate font-medium">{s.team.name}</span>
                </div>
              </td>
              <td className="px-1 py-2 text-center tabular-nums text-muted">
                {s.played}
              </td>
              <td className="px-1 py-2 text-center tabular-nums text-muted">
                {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
              </td>
              <td className="px-2 py-2 text-center font-bold tabular-nums">
                {s.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
