import { Newspaper } from "lucide-react";

const ITEMS = [
  {
    tag: "Phase de groupes",
    title: "Le Mondial à 48 équipes est lancé sur trois pays hôtes",
    time: "Aujourd'hui",
  },
  {
    tag: "Format",
    title: "12 groupes, 104 matchs : le nouveau format expliqué",
    time: "Hier",
  },
  {
    tag: "Stades",
    title: "Les 16 enceintes des États-Unis, du Mexique et du Canada",
    time: "Il y a 2 jours",
  },
];

export default function NewsPage() {
  return (
    <div className="space-y-4 animate-fade-up">
      <header>
        <h1 className="text-xl font-extrabold">Actualités</h1>
        <p className="text-sm text-muted">Le fil du Mondial 2026.</p>
      </header>

      <div className="space-y-2">
        {ITEMS.map((n, i) => (
          <article
            key={i}
            className="flex gap-3 rounded-none border border-border bg-surface p-3"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-none bg-surface-2 text-primary">
              <Newspaper size={18} />
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase text-primary">
                {n.tag}
              </span>
              <h2 className="text-sm font-semibold leading-snug">{n.title}</h2>
              <span className="text-xs text-muted">{n.time}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
