import { Fragment, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { Source } from "@/lib/managers/roster";
import { MAX_BYLINE } from "@/lib/managers/max";

/**
 * Content paragraphs support **bold** and nothing else. Deliberately: the
 * corpus is plain data, and a full markdown pipeline is a lot of surface
 * area for the two emphasis marks we actually use.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-[var(--color-bs-ink)]">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-4 text-[17px] leading-relaxed text-[var(--color-bs-ink-soft)]">
      {items.map((p, i) => (
        <p key={i}>
          <Rich text={p} />
        </p>
      ))}
    </div>
  );
}

/** The answer that answer engines are meant to lift. Kept visually first. */
export function KeyAnswer({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-[var(--color-bs-ink)] bg-black/[0.03] px-5 py-4">
      <p className="text-[19px] leading-relaxed text-[var(--color-bs-ink)]">{children}</p>
    </div>
  );
}

export function SourceList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <section className="border-t border-[var(--color-bs-rule)] pt-6">
      <h2 className="bs-eyebrow">Sources</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-bs-ink-mute)]">
        {sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--color-bs-rule-strong)] underline-offset-2 hover:text-[var(--color-bs-ink)]"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One author, on every page in the section. */
export function AuthorBox({ updated }: { updated?: string }) {
  return (
    <aside className="bs-card-flat flex flex-col gap-2 p-5">
      <span className="bs-eyebrow">Written by</span>
      <Link
        to="/managers/$slug"
        params={{ slug: "max-flohr" }}
        className="text-lg font-semibold text-[var(--color-bs-ink)] underline decoration-[var(--color-bs-rule-strong)] underline-offset-4"
      >
        Max Flohr
      </Link>
      <p className="text-sm leading-relaxed text-[var(--color-bs-ink-soft)]">{MAX_BYLINE}</p>
      {updated ? (
        <p className="text-xs text-[var(--color-bs-ink-mute)]">Last reviewed {updated}</p>
      ) : null}
    </aside>
  );
}

export function FaqBlock({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section>
      <h2 className="bs-display text-2xl md:text-3xl">Common follow-ups</h2>
      <dl className="mt-4 space-y-4">
        {items.map((f) => (
          <div key={f.q} className="bs-card-flat p-5">
            <dt className="text-lg font-semibold text-[var(--color-bs-ink)]">{f.q}</dt>
            <dd className="mt-2 leading-relaxed text-[var(--color-bs-ink-soft)]">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type Quote = NonNullable<import("@/lib/managers/roster").Manager["quote"]>;

/**
 * One quotation, attributed. `speaker` is shown rather than assumed to be the
 * manager, because several of the best lines are said *about* a manager by
 * the artist who hired them.
 */
export function QuoteCard({
  quote,
  attributionHref,
  attributionLabel,
}: {
  quote: Quote;
  /** Where the name links — a profile page, when rendered on the wall. */
  attributionHref?: string;
  attributionLabel?: string;
}) {
  return (
    <figure className="bs-card-flat flex h-full flex-col justify-between p-5">
      <blockquote className="text-[17px] leading-relaxed text-[var(--color-bs-ink)]">
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      <figcaption className="mt-4 text-sm text-[var(--color-bs-ink-mute)]">
        <span className="font-medium text-[var(--color-bs-ink-soft)]">{quote.speaker}</span>
        {quote.context ? <span> — {quote.context}</span> : null}
        {attributionHref && attributionLabel ? (
          <>
            {" · "}
            <a
              href={attributionHref}
              className="underline decoration-[var(--color-bs-rule-strong)] underline-offset-2 hover:text-[var(--color-bs-ink)]"
            >
              {attributionLabel}
            </a>
          </>
        ) : null}
        {" · "}
        <a
          href={quote.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-[var(--color-bs-rule-strong)] underline-offset-2 hover:text-[var(--color-bs-ink)]"
        >
          source
        </a>
      </figcaption>
    </figure>
  );
}
