"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { RocketIcon, RotateCcwIcon, MessageCircleIcon, ArrowRightIcon } from "lucide-react";
import type { RevealPayload } from "@/lib/utils/forms/teamReveal";
import { TIMELINE } from "./teamTimeline";

// three.js only loads on this page, client-side.
const TeamScene = dynamic(() => import("./teamScene"), { ssr: false });

type Phase = "briefing" | "countdown" | "flight" | "revealed";

export default function TeamRevealExperience({ payload }: { payload: RevealPayload }) {
  const { reveal, teamName, teammates, youName, preview } = payload;
  const [phase, setPhase] = useState<Phase>("briefing");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [count, setCount] = useState<string | null>(null);
  const [final, setFinal] = useState(false);

  // Reduced motion: skip the flight and land on the reveal.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFinal(true);
      setPhase("revealed");
    }
  }, []);

  function launch() {
    setFinal(false);
    setStartedAt(performance.now());
    setPhase("countdown");
  }

  // Keyed on the launch itself (not the phase) so changing phase mid-flight
  // doesn't cancel the later marks.
  useEffect(() => {
    if (startedAt === null) return;
    const marks: [number, string | null, Phase?][] = [
      [0, "3"],
      [1000, "2"],
      [2000, "1"],
      [TIMELINE.liftoff * 1000, "Liftoff", "flight"],
      [TIMELINE.liftoff * 1000 + 1100, null],
      [TIMELINE.revealed * 1000, null, "revealed"],
    ];
    const timers = marks.map(([ms, label, next]) =>
      setTimeout(() => {
        setCount(label);
        if (next) setPhase(next);
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [startedAt]);

  const moons = useMemo(() => teammates.map((t) => ({ isYou: t.isYou })), [teammates]);
  const developers = teammates.filter((t) => t.role !== "Designer");
  const designers = teammates.filter((t) => t.role === "Designer");
  const accentStyle = { color: reveal.color };

  return (
    <div className="fixed inset-0 h-[100svh] overflow-hidden text-white" style={{ background: "radial-gradient(130% 90% at 72% -12%, #252c58 0%, #131530 42%, #07080f 100%)" }}>
      <div className="absolute inset-0">
        <TeamScene
          color={reveal.color}
          accent={reveal.accent}
          moons={moons}
          startedAt={startedAt}
          final={final}
        />
      </div>

      {preview && (
        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border border-amber-400/60 bg-amber-400/15 px-4 py-1 text-xs text-amber-200">
          Admin preview: {teamName}
        </div>
      )}

      {phase === "briefing" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div className="glass-panel flex max-w-lg flex-col items-center gap-5 p-8 text-center animate-fade-up lg:p-12">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-lp-200/90">
              Mission briefing · {payload.formTitle}
            </span>
            <h1 className="font-heading text-3xl font-bold lg:text-4xl">
              {youName}, your team is ready.
            </h1>
            <p className="text-neutral-300">
              Strap in. Your project assignment is waiting at the end of this flight.
            </p>
            <button
              onClick={launch}
              className="group mt-2 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-lp-700 via-lp-500 to-lp-400 px-8 py-4 text-lg font-semibold shadow-[0_0_40px_rgba(124,140,255,0.45)] transition-transform hover:scale-105"
            >
              <RocketIcon className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Launch
            </button>
          </div>
        </div>
      )}

      {count && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            key={count}
            className="font-heading text-[22vw] font-bold leading-none text-white/90 drop-shadow-[0_0_30px_rgba(124,140,255,0.8)] animate-countdown lg:text-[12rem]"
          >
            {count}
          </span>
        </div>
      )}

      {phase === "revealed" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:items-center lg:justify-start lg:p-12">
          <div className="glass-panel pointer-events-auto flex max-h-[64svh] w-full max-w-xl flex-col gap-4 overflow-y-auto p-5 animate-fade-up lg:max-h-[85vh] lg:gap-5 lg:p-9">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-300 lg:text-[11px]">
                Welcome to
              </span>
              <h1 className="font-heading text-[clamp(1.75rem,8vw,3rem)] font-bold leading-[1.05]" aria-label={teamName}>
                {teamName.split(" ").map((word, w, words) => (
                  // Keep words intact so long names wrap between words.
                  <span key={w} className="inline-block whitespace-nowrap">
                    {word.split("").map((ch, i) => (
                      <span
                        key={i}
                        aria-hidden
                        className="inline-block animate-letter"
                        style={{ ...accentStyle, animationDelay: `${(teamName.indexOf(word) + i) * 30}ms` }}
                      >
                        {ch}
                      </span>
                    ))}
                    {w < words.length - 1 && "\u00a0"}
                  </span>
                ))}
              </h1>
              <p className="pt-1 text-sm text-neutral-200 lg:text-base">{reveal.tagline}</p>
            </div>

            {[
              ["Developers", developers],
              ["Designers", designers],
            ].map(([label, list]) =>
              (list as typeof teammates).length ? (
                <div key={label as string} className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {label as string} · {(list as typeof teammates).length}
                  </span>
                  {/* Chips keep big teams compact on phones. */}
                  <ul className="flex flex-wrap gap-1.5">
                    {(list as typeof teammates).map((m) => (
                      <li
                        key={m.name}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] ${m.isYou ? "bg-white text-background-900 font-semibold" : "bg-white/[0.07] text-neutral-100"}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: reveal.color }} />
                        {m.name}
                        {m.isYou && <span className="text-[10px] uppercase tracking-wide opacity-70">you</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}

            {reveal.stack.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {reveal.stack.map((s) => (
                  <span key={s} className="rounded-full border px-2.5 py-0.5 text-[11px] lg:text-xs" style={{ borderColor: `${reveal.color}88`, color: reveal.color }}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Pinned to the card's bottom edge so the actions stay visible
                while a big team list scrolls underneath. */}
            <div className="sticky -bottom-5 -mx-5 -mb-5 mt-auto flex flex-col gap-2 bg-gradient-to-t from-[#14161f] from-70% to-transparent px-5 pb-5 pt-6 sm:flex-row sm:flex-wrap lg:static lg:m-0 lg:bg-none lg:p-0 lg:pt-1">
              {reveal.discordChannel && (
                <a
                  href={reveal.discordChannel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-background-900"
                  style={{ background: reveal.color }}
                >
                  <MessageCircleIcon className="h-4 w-4" />
                  Open team channel
                </a>
              )}
              <div className="flex gap-2">
                <a
                  href="/portal/onboarding"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm hover:bg-white/10 sm:flex-none"
                >
                  Onboarding
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
                <button
                  onClick={launch}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm text-neutral-300 hover:bg-white/10"
                >
                  <RotateCcwIcon className="h-4 w-4" />
                  Replay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
