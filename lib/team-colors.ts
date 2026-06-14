/**
 * Brand colours per nation (derived from flag colours), used to re-theme the
 * app around the user's primary favourite team. `primary` is a vivid mid-tone
 * that reads on both light and dark backgrounds; `secondary` is used for the
 * header gradient.
 */
export interface TeamColors {
  primary: string;
  secondary: string;
}

export const TEAM_COLORS: Record<string, TeamColors> = {
  ALG: { primary: "#007a3d", secondary: "#d21034" },
  ARG: { primary: "#2a7de1", secondary: "#f6b40e" },
  AUS: { primary: "#00843d", secondary: "#ffcd00" },
  AUT: { primary: "#ed2939", secondary: "#1f1f1f" },
  BEL: { primary: "#ef3340", secondary: "#fdda24" },
  BIH: { primary: "#1f55c4", secondary: "#fecb00" },
  BRA: { primary: "#009c3b", secondary: "#ffdf00" },
  CAN: { primary: "#d80621", secondary: "#2b2b2b" },
  CIV: { primary: "#ff8200", secondary: "#009a44" },
  COD: { primary: "#1f8bff", secondary: "#f7d618" },
  COL: { primary: "#1f57c4", secondary: "#fcd116" },
  CPV: { primary: "#1f57c4", secondary: "#cf2027" },
  CRO: { primary: "#e8112d", secondary: "#1f4ab0" },
  CUW: { primary: "#1f44b0", secondary: "#f9e814" },
  CZE: { primary: "#1f57a8", secondary: "#d7141a" },
  ECU: { primary: "#1f6fd0", secondary: "#ffd400" },
  EGY: { primary: "#ce1126", secondary: "#2b2b2b" },
  ENG: { primary: "#cf142b", secondary: "#1f3a8a" },
  ESP: { primary: "#d12333", secondary: "#ffc400" },
  FRA: { primary: "#1f6bd6", secondary: "#ef4135" },
  GER: { primary: "#dd2222", secondary: "#ffce00" },
  GHA: { primary: "#11843f", secondary: "#fcd116" },
  HAI: { primary: "#1f44c4", secondary: "#d21034" },
  IRN: { primary: "#239f40", secondary: "#da0000" },
  IRQ: { primary: "#11843f", secondary: "#ce1126" },
  JOR: { primary: "#11843f", secondary: "#ce1126" },
  JPN: { primary: "#cc0033", secondary: "#2b2b2b" },
  KOR: { primary: "#1f5bd0", secondary: "#c60c30" },
  KSA: { primary: "#138f4a", secondary: "#1f1f1f" },
  MAR: { primary: "#c1272d", secondary: "#0b8a3f" },
  MEX: { primary: "#0b8a4f", secondary: "#ce1126" },
  NED: { primary: "#ff6a00", secondary: "#21468b" },
  NOR: { primary: "#cf1a3a", secondary: "#1f3a8a" },
  NZL: { primary: "#1f47b0", secondary: "#cc142b" },
  PAN: { primary: "#1f6fbf", secondary: "#da121a" },
  PAR: { primary: "#d52b1e", secondary: "#1f57c4" },
  POR: { primary: "#0b8a2f", secondary: "#ff0000" },
  QAT: { primary: "#9c1a44", secondary: "#2b2b2b" },
  RSA: { primary: "#0b8a55", secondary: "#ffb915" },
  SCO: { primary: "#1f6fd6", secondary: "#1f1f1f" },
  SEN: { primary: "#11843f", secondary: "#fdef42" },
  SUI: { primary: "#e8332a", secondary: "#2b2b2b" },
  SWE: { primary: "#1f7ac4", secondary: "#fecc00" },
  TUN: { primary: "#e21b2c", secondary: "#2b2b2b" },
  TUR: { primary: "#e30a17", secondary: "#2b2b2b" },
  URU: { primary: "#1f57c4", secondary: "#7cafe0" },
  USA: { primary: "#b22234", secondary: "#3c3b6e" },
  UZB: { primary: "#1eb53a", secondary: "#0099b5" },
};

export function getTeamColors(code?: string): TeamColors | null {
  if (!code) return null;
  return TEAM_COLORS[code] ?? null;
}

function relativeLuminance(hex: string): number {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Readable text colour to sit on top of `hex`. */
export function readableOn(hex: string): string {
  return relativeLuminance(hex) > 0.5 ? "#0a0e17" : "#ffffff";
}
