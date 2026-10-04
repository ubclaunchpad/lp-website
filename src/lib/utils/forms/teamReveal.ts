// Team reveal page config. Plain module: safe for client and server imports.

// Per-team presentation, stored at teams.meta.reveal so new terms only need
// data, not code. `accent` picks the 3D signature orbiting the team's planet.
export type RevealAccent = "graph" | "constellation" | "arcs" | "cluster" | "rings";

export type TeamReveal = {
  tagline: string;
  color: string; // hex, drives the planet, glow and UI accents
  accent: RevealAccent;
  stack: string[];
  discordChannel?: string; // https://discord.com/channels/<guild>/<channel>
};

export type Teammate = {
  name: string;
  role: "Developer" | "Designer" | string;
  isYou: boolean;
};

export type RevealPayload = {
  formTitle: string;
  teamName: string;
  reveal: TeamReveal;
  teammates: Teammate[];
  youName: string;
  preview: boolean; // admin preview: banner + no gate
};

const FALLBACK: TeamReveal = {
  tagline: "Your project team for this year.",
  color: "#7c8cff",
  accent: "rings",
  stack: [],
};

export function getTeamReveal(meta: any): TeamReveal {
  const r = meta?.reveal ?? {};
  return {
    ...FALLBACK,
    ...r,
    stack: Array.isArray(r.stack) ? r.stack : [],
    discordChannel: r.discordChannel ?? meta?.discord?.channel,
  };
}

// Admins flip this in Settings → Team reveal (closed until kickoff).
export function isTeamRevealOpen(formConfig: any): boolean {
  return formConfig?.application?.teamReveal?.open === true;
}

// "VANSHIKA DIXIT" -> "Vanshika Dixit"; leaves mixed-case names alone.
function tidy(name: string): string {
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (trimmed !== trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) {
    return trimmed;
  }
  return trimmed.replace(/\b\p{L}/gu, (c) => c.toUpperCase()).replace(
    /\B\p{L}+/gu,
    (rest) => rest.toLowerCase(),
  );
}

export function displayName(details: any): string {
  const first = (details?.preferredName || details?.firstName || "").trim();
  const last = (details?.lastName || "").trim();
  return tidy(`${first} ${last}`) || "Launch Pad member";
}

export function firstName(details: any): string {
  return tidy((details?.preferredName || details?.firstName || "there").split(" ")[0]);
}
