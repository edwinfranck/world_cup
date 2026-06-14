import type { Player } from "@/lib/types";
import { englishNameFor } from "@/lib/data/seed";

/**
 * Player / squad data from TheSportsDB — a genuinely FREE source (no card, no
 * signup) that also ships player PHOTOS. The public test key works for the
 * endpoints we use. A paid key can be dropped in via SPORTSDB_KEY for higher
 * limits, but the app never requires it.
 *
 * Flow: resolve the national team id by English name (cached per process),
 * then fetch its players. Failures degrade gracefully to an empty squad.
 */

const KEY = process.env.SPORTSDB_KEY || "3"; // "3" = free public test key
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;

// TheSportsDB names that differ from the dataset's English names.
const NAME_OVERRIDE: Record<string, string> = {
  USA: "USA",
  COD: "DR Congo",
  CPV: "Cape Verde",
};

const _idCache = new Map<string, string | null>();

interface SdbTeam {
  idTeam: string;
  strTeam: string;
  strSport?: string;
}
interface SdbPlayer {
  idPlayer: string;
  strPlayer: string;
  strPosition?: string;
  strNumber?: string;
  strNationality?: string;
  strThumb?: string;
  strCutout?: string;
  strTeam?: string;
  dateBorn?: string;
  strDescriptionEN?: string;
}

async function resolveTeamId(code: string): Promise<string | null> {
  if (_idCache.has(code)) return _idCache.get(code)!;
  const name = NAME_OVERRIDE[code] ?? englishNameFor(code) ?? code;
  let id: string | null = null;
  try {
    const res = await fetch(
      `${BASE}/searchteams.php?t=${encodeURIComponent(name)}`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = (await res.json()) as { teams: SdbTeam[] | null };
      const soccer = (data.teams ?? []).filter(
        (t) => !t.strSport || t.strSport === "Soccer"
      );
      id = soccer[0]?.idTeam ?? null;
    }
  } catch {
    id = null;
  }
  _idCache.set(code, id);
  return id;
}

function mapPlayer(p: SdbPlayer): Player {
  return {
    id: p.idPlayer,
    name: p.strPlayer,
    position: p.strPosition || undefined,
    number: p.strNumber || undefined,
    nationality: p.strNationality || undefined,
    thumb: p.strCutout || p.strThumb || undefined,
    club: p.strTeam || undefined,
    birthDate: p.dateBorn || undefined,
    description: p.strDescriptionEN || undefined,
  };
}

const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
function positionRank(pos?: string): number {
  if (!pos) return 99;
  const i = POSITION_ORDER.findIndex((p) =>
    pos.toLowerCase().includes(p.toLowerCase().slice(0, 4))
  );
  return i === -1 ? 50 : i;
}

export async function fetchSquad(code: string): Promise<Player[]> {
  const id = await resolveTeamId(code);
  if (!id) return [];
  try {
    const res = await fetch(`${BASE}/lookup_all_players.php?id=${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { player: SdbPlayer[] | null };
    const players = (data.player ?? []).map(mapPlayer);
    return players.sort(
      (a, b) =>
        positionRank(a.position) - positionRank(b.position) ||
        a.name.localeCompare(b.name)
    );
  } catch {
    return [];
  }
}

export async function fetchPlayer(id: string): Promise<Player | null> {
  try {
    const res = await fetch(`${BASE}/lookupplayer.php?id=${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { players: SdbPlayer[] | null };
    return data.players?.[0] ? mapPlayer(data.players[0]) : null;
  } catch {
    return null;
  }
}
