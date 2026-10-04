"use client";
import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { instagramUrl } from "@/lib/utils/instagram";

type Person = { name: string; username: string; isYou: boolean };

export default function InstagramDirectory({ people }: { people: Person[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    const list = q
      ? people.filter((p) => p.name.toLowerCase().includes(q) || p.username.includes(q))
      : people;
    // You first, then alphabetical.
    return [...list].sort((a, b) => Number(b.isYou) - Number(a.isYou) || a.name.localeCompare(b.name));
  }, [people, query]);

  return (
    <section className="glass-panel flex flex-col gap-4 p-6 animate-fade-up sm:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-white">Launch Pad on Instagram</h2>
        <span className="shrink-0 text-xs text-neutral-400">{people.length} people</span>
      </div>

      {people.length > 6 && (
        <label className="flex items-center gap-2 rounded-xl border border-background-500 bg-background-700 px-3 focus-within:ring-2 focus-within:ring-lp-400">
          <SearchIcon className="h-4 w-4 shrink-0 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names or handles"
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full bg-transparent py-2.5 text-base text-white outline-none placeholder:text-neutral-500"
          />
        </label>
      )}

      <ul className="flex flex-col divide-y divide-white/[0.06]">
        {shown.map((p) => (
          <li key={p.username}>
            <a
              href={instagramUrl(p.username)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 py-3 active:opacity-70"
            >
              <span className="min-w-0 truncate text-sm text-neutral-100">
                {p.name}
                {p.isYou && (
                  <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide">you</span>
                )}
              </span>
              <span className="shrink-0 text-sm text-lp-300">@{p.username}</span>
            </a>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="py-6 text-center text-sm text-neutral-400">No one matches “{query}”.</li>
        )}
      </ul>
    </section>
  );
}
