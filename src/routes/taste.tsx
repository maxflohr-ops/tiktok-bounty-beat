import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GENRES, VIBES, saveTaste, type TasteProfile } from "@/lib/taste";

export const Route = createFileRoute("/taste")({
  head: () => ({
    meta: [
      { title: "Tune your board · Bounty Sounds" },
      {
        name: "description",
        content:
          "Thirty seconds of taste questions, then a board ranked to the sounds you'd actually clip.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: TastePage,
});

const REWARDS = [
  { id: "steady", label: "Steady", sub: "a set amount per approved clip" },
  { id: "upside", label: "Upside", sub: "paid per 100k verified views" },
  { id: "either", label: "Show me both", sub: "rank purely on taste" },
] as const;

function TastePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const finish = (reward: TasteProfile["reward"]) => {
    saveTaste({ genres, vibes, reward });
    navigate({ to: "/board" });
  };

  const steps = [
    {
      label: "your sound",
      title: "What do you listen to?",
      sub: "Pick a few. The Bounty Board ranks to match.",
      body: (
        <>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {GENRES.map((g) => (
              <button
                key={g.id}
                aria-pressed={genres.includes(g.id)}
                onClick={() => toggle(genres, setGenres, g.id)}
                className="filter-chip px-5 py-3 text-sm"
              >
                {g.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="silver-btn mt-10 px-10"
            disabled={genres.length === 0}
          >
            continue
          </button>
        </>
      ),
    },
    {
      label: "your vibe",
      title: "What kind of clips do you make?",
      sub: "Energy and mood.",
      body: (
        <>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {VIBES.map((v) => (
              <button
                key={v.id}
                aria-pressed={vibes.includes(v.id)}
                onClick={() => toggle(vibes, setVibes, v.id)}
                className="filter-chip px-5 py-3 text-sm"
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            className="silver-btn mt-10 px-10"
            disabled={vibes.length === 0}
          >
            continue
          </button>
        </>
      ),
    },
    {
      label: "your payout",
      title: "How do you like getting paid?",
      sub: "One tap and your board is ready.",
      body: (
        <div className="mx-auto mt-8 grid max-w-lg gap-3">
          {REWARDS.map((r) => (
            <button
              key={r.id}
              onClick={() => finish(r.id)}
              className="contract contract-nail p-5 text-left"
            >
              <span className="font-display text-lg font-bold text-ink">{r.label}</span>
              <span className="mt-1 block text-sm text-ink-soft">{r.sub}</span>
            </button>
          ))}
        </div>
      ),
    },
  ];

  const s = steps[step];

  return (
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <SiteHeader />

      <section className="container-board relative z-10 flex flex-col items-center py-14 text-center md:py-20">
        <div className="flex items-center gap-3">
          {steps.map((x, i) => (
            <span
              key={x.label}
              className={`terminal text-[10px] ${i === step ? "text-[var(--gold)]" : "text-bone-soft opacity-50"}`}
            >
              {String(i + 1).padStart(2, "0")} {x.label}
            </span>
          ))}
        </div>

        <h1 className="mt-6 max-w-2xl font-display text-3xl md:text-5xl">{s.title}</h1>
        <p className="mt-3 max-w-xl text-bone-soft">{s.sub}</p>
        {s.body}

        <div className="mt-10 flex items-center gap-6">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="terminal inline-flex min-h-[44px] items-center text-xs text-bone-soft underline hover:text-bone md:min-h-0"
            >
              back
            </button>
          ) : null}
          <Link
            to="/board"
            className="terminal inline-flex min-h-[44px] items-center text-xs text-bone-soft underline hover:text-bone md:min-h-0"
          >
            skip — show me everything
          </Link>
        </div>
      </section>
    </div>
  );
}
