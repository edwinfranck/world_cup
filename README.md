# Mondial 2026 — Live ⚽

Plateforme web + PWA dédiée à la Coupe du Monde FIFA 2026, dans l'esprit de
SofaScore / Flashscore. **Fonctionne immédiatement, gratuitement et hors ligne** :
aucune clé API n'est requise.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript
- **Tailwind CSS v4** (thème sombre par défaut, design tokens)
- **TanStack Query** (rafraîchissement live des données)
- **next-themes** (mode sombre / clair)
- **PWA** (manifest + service worker, mode hors ligne)
- **Zustand** (état client, prêt pour favoris/pronostics)

## Démarrage

```bash
npm install
npm run dev       # http://localhost:3000
npm run build && npm start
```

## Données — 100 % gratuit

Le projet repose sur une **couche d'adaptateurs** (`lib/data/`) :

- `seed-provider` — jeu de données complet et déterministe (48 équipes, 12 groupes,
  72 matchs, classements calculés). **Actif par défaut**, sans configuration.
- `football-data-provider` — adaptateur pour l'API **gratuite**
  [Football-Data.org](https://www.football-data.org/) (token gratuit, sans carte).

Pour activer les données réelles : copiez `.env.example` → `.env.local` et
renseignez `FOOTBALL_DATA_TOKEN`. En cas d'erreur ou de quota dépassé, l'app
retombe automatiquement sur les données seed (jamais d'écran vide).

Changer de fournisseur = une ligne dans `lib/data/index.ts` (`getProvider`).

## Implémenté (slice "live scores")

- Dashboard : matchs en direct, du jour, résultats récents, aperçu classements
- Calendrier complet avec filtres par phase + regroupement par jour
- Classements des 12 groupes en temps réel (qualifiés mis en évidence)
- Détail d'un match : tableau de score, statut live, stade, statistiques
- Tableau final (qualifiés projetés)
- PWA installable + mode hors ligne · thème clair/sombre

## Architecture

```
app/                 pages (App Router) + routes API mises en cache
  api/               /matches /matches/[id] /groups /teams
components/          UI réutilisable (match-card, standings, layout…)
lib/
  types.ts           modèle de domaine agnostique du fournisseur
  data/              interface DataProvider + adaptateurs + fallback
  api.ts             hooks React Query côté client
public/              manifest PWA, service worker, icône
```

## Suite (roadmap)

Fiches équipe/joueur · favoris · pronostics & gamification · fantasy ·
stats avancées (xG) · recherche · notifications push · simulateur ·
actualités · auth (NextAuth) · multilingue. Le modèle de domaine et la couche
de données sont conçus pour accueillir ces modules sans refonte.
