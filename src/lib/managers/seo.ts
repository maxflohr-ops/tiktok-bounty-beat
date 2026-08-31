import { MAX_PERSON } from "./max";

export const SITE = "https://bountysounds.com";

/** The section's own identity, referenced by every page's JSON-LD graph. */
export const MANAGERS_COLLECTION_ID = `${SITE}/managers#collection`;

export function canonical(path: string) {
  return `${SITE}${path}`;
}

/**
 * Every public page in this section gets the same head shape. Titles are
 * suffixed once, here, so no page can invent its own convention.
 */
export function headFor({
  title,
  description,
  path,
  jsonLd = [],
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  jsonLd?: unknown[];
  noindex?: boolean;
}) {
  const url = canonical(path);
  const full = `${title} · Bounty Sounds`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex" }] : []),
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: "Bounty Sounds" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "author", content: "Max Flohr" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: jsonLd.map((node) => ({
      type: "application/ld+json",
      children: JSON.stringify(node),
    })),
  };
}

/** Breadcrumbs give answer engines the section's shape in one object. */
export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: canonical(t.path),
    })),
  };
}

export function faqJsonLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * The answer pages are articles with a named, credentialed author. That
 * authorship link is the entire point of the section's schema: it ties
 * every answer about music management back to one Person entity.
 */
export function articleJsonLd({
  headline,
  description,
  path,
  citations,
}: {
  headline: string;
  description: string;
  path: string;
  citations?: { label: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical(path) },
    author: MAX_PERSON,
    publisher: {
      "@type": "Organization",
      name: "Bounty Sounds",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/og.png` },
    },
    isPartOf: { "@id": MANAGERS_COLLECTION_ID },
    ...(citations?.length
      ? { citation: citations.map((c) => ({ "@type": "CreativeWork", name: c.label, url: c.url })) }
      : {}),
  };
}
