import { ExternalLink, Music2, Play } from "lucide-react";
import { FLAGSHIP } from "@/lib/flagship";
import { Money } from "@/components/Money";

/** "LIVE NOW" pill — flagship only. */
export function LiveNowBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`digital-badge-magenta inline-flex items-center gap-1.5 ${className}`}>
      <span className="status-dot-magenta" />
      LIVE NOW
    </span>
  );
}

/** TikTok / Reels platform chips. */
export function PlatformIcons({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {FLAGSHIP.platforms.map((p) => (
        <span
          key={p.key}
          className="inline-flex items-center gap-1 border border-[var(--paper-dark)] px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-ink-soft"
        >
          <Music2 aria-hidden className="h-3 w-3" />
          {p.label}
        </span>
      ))}
    </span>
  );
}

/** Live purse-remaining bar. */
export function PurseBar({
  purseCents,
  paidCents,
  currency = "USD",
}: {
  purseCents: number;
  paidCents: number;
  currency?: string;
}) {
  const remaining = Math.max(0, purseCents - (paidCents || 0));
  const pct = purseCents > 0 ? Math.round((remaining / purseCents) * 100) : 0;
  return (
    <div className="mt-4 border-t border-[var(--paper-dark)] pt-4">
      <div className="flex items-baseline justify-between">
        <span className="label-cap text-ink-soft">Purse remaining</span>
        <span className="[font-family:var(--font-brand)] text-lg font-semibold text-ink">
          <Money cents={remaining} currency={currency} /> <span className="text-xs text-ink-soft">/ <Money cents={purseCents} currency={currency} /> · {pct}%</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Purse remaining"
        className="mt-2 h-3 w-full overflow-hidden border border-[var(--paper-dark)] bg-black/10"
      >
        <div className="h-full bg-[var(--wax-red)] transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        First verified, first paid, until the purse is dry. Caps at 2,500,000 verified views.
      </p>
    </div>
  );
}

/** Source material, official sounds, verbatim rules and the hook bank. */
export function FlagshipPanels() {
  const f = FLAGSHIP;
  return (
    <>
      <section className="mt-6 border-t border-[var(--paper-dark)] pt-4">
        <div className="label-cap text-ink-soft">Source material</div>
        <a
          href={f.source.youtube}
          target="_blank"
          rel="noreferrer"
          className="group mt-2 block border border-[var(--paper-dark)]"
        >
          <span className="relative block">
            <img
              src={f.hero.image}
              alt={f.hero.alt}
              loading="lazy"
              className="block w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 bg-black/70 px-3 py-1.5 text-xs uppercase tracking-widest text-white">
                <Play aria-hidden className="h-3.5 w-3.5" /> watch on YouTube
              </span>
            </span>
          </span>
          <span className="block px-3 py-2 font-body text-sm text-ink">{f.source.youtubeTitle}</span>
        </a>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <a href={f.source.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-body text-ink underline">
              Rockstar Games official announcement <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>
            <a href={f.source.netflix} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-body text-ink underline">
              Netflix info page <ExternalLink className="h-3 w-3" />
            </a>
          </li>
        </ul>
        <p className="mt-2 text-xs text-ink-soft">{f.source.note}</p>
      </section>

      <section className="mt-6 border-t border-[var(--paper-dark)] pt-4">
        <div className="label-cap text-ink-soft">Use this sound</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {f.sounds.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-[var(--paper-dark)] px-3 py-1.5 font-body text-sm text-ink hover:bg-black/5"
            >
              <Music2 aria-hidden className="h-3.5 w-3.5" />
              {s.label}
              {s.required ? <span className="text-[10px] uppercase tracking-widest text-[var(--wax-red)]">required</span> : null}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Pick the sound from TikTok's sound picker (or Reels audio) — attribution is what gets you paid.
        </p>
      </section>

      <section className="mt-6 border-t border-[var(--paper-dark)] pt-4">
        <div className="label-cap text-ink-soft">Rules — violations marked “seized”</div>
        <ol className="mt-2 list-decimal space-y-2 pl-5 font-body text-sm leading-relaxed text-ink-soft">
          {f.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">{f.rightsNote}</p>
      </section>

      <section className="mt-6 border-t border-[var(--paper-dark)] pt-4">
        <div className="label-cap text-ink-soft">Steal these hooks</div>
        <ul className="mt-2 space-y-1 font-body text-sm text-ink-soft">
          {f.hooks.map((h) => (
            <li key={h}>“{h}”</li>
          ))}
        </ul>
      </section>
    </>
  );
}
