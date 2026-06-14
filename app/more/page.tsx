import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Heart,
  MapPin,
  Newspaper,
  Search,
  Target,
  User,
  Users,
} from "lucide-react";

const LINKS = [
  { href: "/favorites", label: "Mes favoris", desc: "Équipes & matchs suivis", icon: Heart },
  { href: "/predictions", label: "Pronostics", desc: "Pariez et marquez des points", icon: Target },
  { href: "/teams", label: "Équipes", desc: "Les 48 nations qualifiées", icon: Users },
  { href: "/stadiums", label: "Stades", desc: "Les 16 enceintes du Mondial", icon: MapPin },
  { href: "/stats", label: "Statistiques", desc: "Chiffres clés du tournoi", icon: BarChart3 },
  { href: "/profile", label: "Profil", desc: "XP, niveaux & badges", icon: User },
  { href: "/search", label: "Recherche", desc: "Équipes, matchs, stades", icon: Search },
  { href: "/news", label: "Actualités", desc: "Le fil du Mondial", icon: Newspaper },
];

export default function MorePage() {
  return (
    <div className="space-y-4 animate-fade-up">
      <h1 className="text-xl font-extrabold">Plus</h1>
      <div className="overflow-hidden rounded-none border border-border bg-surface">
        {LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 transition-colors hover:bg-surface-2"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-none bg-surface-2 text-primary">
              <Icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block truncate text-xs text-muted">{desc}</span>
            </span>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
