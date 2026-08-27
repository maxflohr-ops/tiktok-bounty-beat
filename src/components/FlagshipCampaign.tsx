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

/** The two things that matter: what to clip, and what sound to use. */
export function FlagshipTopMedia() {
  const f = FLAGSHIP;
  const tiktokSound = f.sounds.find((s) => s.required) ?? f.sounds[0];
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <a
        href={f.source.youtube}
        target="_blank"
        rel="noreferrer"
        className="group block border border-[var(--paper-dark)] bg-black/5 transition hover:bg-black/10"
      >
        <span className="relative block">
          <img src={f.hero.image} alt={f.hero.alt} loading="lazy" className="block aspect-video w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 bg-black/70 px-3 py-1.5 text-xs uppercase tracking-widest text-white">
              <Play aria-hidden className="h-3.5 w-3.5" /> watch on YouTube
            </span>
          </span>
        </span>
        <span className="block px-3 py-2">
          <span className="label-cap block text-[var(--wax-red)]">Clip this</span>
          <span className="mt-0.5 block font-body text-sm text-ink">{f.source.youtubeTitle}</span>
        </span>
      </a>

      <a
        href={tiktokSound.url}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col justify-center border border-[var(--paper-dark)] bg-black/5 px-4 py-5 transition hover:bg-black/10"
      >
        <span className="label-cap block text-[var(--wax-red)]">Use this sound</span>
        <span className="mt-1 flex items-center gap-2 [font-family:var(--font-brand)] text-xl font-semibold text-ink">
          <Music2 aria-hidden className="h-5 w-5" /> “biting bullets” — official TikTok sound
        </span>
        <span className="mt-2 inline-flex items-center gap-1 font-body text-sm text-ink underline">
          open the sound page <ExternalLink className="h-3 w-3" />
        </span>
        <span className="mt-2 block text-xs text-ink-soft">
          Pick it from TikTok's sound picker (or Reels audio) — the attribution is what gets you paid.
        </span>
      </a>
    </div>
  );
}

/** Rules, rights note, remaining links and the hook bank. */
export function FlagshipPanels() {
  const f = FLAGSHIP;
  const extras = f.sounds.filter((s) => !s.required);
  return (
    <>
      <section className="mt-5 border-t border-[var(--paper-dark)] pt-4">
        <div className="label-cap text-ink-soft">Rules — violations marked “seized”</div>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 font-body text-sm leading-relaxed text-ink-soft">
          {f.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
          <li className="text-[13px]">{f.rightsNote}</li>
        </ol>
      </section>

      <section className="mt-5 border-t border-[var(--paper-dark)] pt-4">
        <div className="label-cap text-ink-soft">More links</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {extras.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-[var(--paper-dark)] px-3 py-1 font-body text-sm text-ink hover:bg-black/5"
            >
              <Music2 aria-hidden className="h-3.5 w-3.5" />
              {s.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
          <a
            href={f.source.netflix}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-[var(--paper-dark)] px-3 py-1 font-body text-sm text-ink hover:bg-black/5"
          >
            Netflix info page <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="mt-2 text-xs text-ink-soft">{f.source.note}</p>
      </section>

      <section className="mt-5 border-t border-[var(--paper-dark)] pt-4">
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

