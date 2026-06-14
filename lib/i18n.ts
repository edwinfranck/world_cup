"use client";

import { useAppStore, type Locale } from "@/lib/store";

/**
 * Lightweight i18n. Keys cover the app chrome (nav + common labels); coverage
 * is progressive. t() falls back to French, then to the key itself.
 */
const DICT: Record<string, Record<Locale, string>> = {
  "nav.home": { fr: "Accueil", en: "Home", es: "Inicio" },
  "nav.matches": { fr: "Matchs", en: "Matches", es: "Partidos" },
  "nav.predictions": { fr: "Pronos", en: "Predict", es: "Pronós." },
  "nav.simulator": { fr: "Simulateur", en: "Simulator", es: "Simulador" },
  "nav.more": { fr: "Plus", en: "More", es: "Más" },
  "common.live": { fr: "En direct", en: "Live", es: "En vivo" },
  "common.upcoming": { fr: "Prochains matchs", en: "Upcoming", es: "Próximos" },
  "common.results": { fr: "Résultats récents", en: "Recent results", es: "Resultados" },
  "common.standings": { fr: "Classements", en: "Standings", es: "Clasificación" },
  "common.favorites": { fr: "Mes favoris", en: "My favorites", es: "Mis favoritos" },
  "common.seeAll": { fr: "Tout voir", en: "See all", es: "Ver todo" },
};

export function useT() {
  const locale = useAppStore((s) => s.locale);
  return (key: string) => DICT[key]?.[locale] ?? DICT[key]?.fr ?? key;
}

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];
