/** Map a WMO weather code to an emoji + short French label. */
export function weatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Ensoleillé" };
  if (code <= 2) return { emoji: "🌤️", label: "Éclaircies" };
  if (code === 3) return { emoji: "☁️", label: "Nuageux" };
  if (code <= 48) return { emoji: "🌫️", label: "Brouillard" };
  if (code <= 57) return { emoji: "🌦️", label: "Bruine" };
  if (code <= 67) return { emoji: "🌧️", label: "Pluie" };
  if (code <= 77) return { emoji: "🌨️", label: "Neige" };
  if (code <= 82) return { emoji: "🌧️", label: "Averses" };
  if (code <= 86) return { emoji: "🌨️", label: "Averses de neige" };
  return { emoji: "⛈️", label: "Orage" };
}
