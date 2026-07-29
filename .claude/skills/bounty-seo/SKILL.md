---
name: bounty-seo
description: SEO review and maintenance for bountysounds.com — run whenever adding or renaming a route, changing page copy, or doing an SEO pass. Site-specific checklist plus the OpenSEO methodology skills installed alongside it.
---

# Bounty Sounds SEO

Methodology adapted from OpenSEO (github.com/every-app/open-seo). Their live-data
workflows (keyword-research, keyword-clustering, competitive-landscape,
link-prospecting, seo-coach — installed as sibling skills) need the OpenSEO MCP
plus a DataForSEO key; everything below works without them.

## Content principles (from openseo-review-web-content, adopted wholesale)

1. **Traceable truth.** Every claim on the site must be verifiable against the
   product: "funded pots" must be labeled in the UI, "checked deliveries" must
   match the verification code in `src/lib/submissions.functions.ts`,
   "PayPal, Stripe, or USDC" must match the actual payout paths. If you can't
   point to where it's true, it doesn't ship.
2. **Lead with the real answer.** FAQ answers open with the answer, including
   when it's "no" or "it costs $200."
3. **Sound like a person.** Read the sharpest line aloud before shipping it.

## The checklist — run on every route change

1. **Every public route** exports `head()` with: unique `title`
   (`Thing · Bounty Sounds`), `description` ≤ 160 chars that leads with the
   real answer, `og:title`/`og:description`, and a `canonical` link to the
   exact `https://bountysounds.com/<path>` URL.
2. **Private or thin routes** (`/taste`, everything under `_authenticated/`)
   carry `robots: noindex` in `head()`. Truly private surfaces also get a
   `Disallow` in `public/robots.txt`; pages that are merely thin (like `/taste`)
   rely on the meta alone — a robots block would hide the noindex from crawlers.
3. **`public/sitemap.xml` lists every indexable route** — this is the one that
   silently rots. Adding a route = adding a `<url>` entry. Noindex routes stay
   out.
4. **FAQ pages ship `FAQPage` JSON-LD** built from the same array that renders
   the visible FAQ (pattern in `src/routes/for-editors.tsx`) — never a second
   copy that can drift.
5. **One `h1` per page**, matching the page's search intent, not just its vibe.
6. **Internal links**: every new page is reachable from the landing explore hub
   or a footer within one click, and links back.

## Current keyword map (update as pages are added)

| Route | Primary intent |
| --- | --- |
| `/` | bounty sounds, clip sounds get paid |
| `/board` | tiktok clipping bounties, live clipping contracts |
| `/for-artists` | tiktok music promotion for artists |
| `/for-editors` | ugc creator jobs, get paid to edit tiktoks |
| `/clipping-campaigns` | clipping campaigns, pay per view campaign |
| `/tiktok-clipper` | become a tiktok clipper, tiktok clipper jobs |
| `/keynotes` | keynote clipping campaign, clip keynote speech |
| `/list-sound` | promote my song on tiktok (transactional) |

## When live data is wanted

Connect the OpenSEO MCP (self-host github.com/every-app/open-seo or hosted at
openseo.so, bring a DataForSEO key), then run `seo-project-setup` followed by
`keyword-research` / `keyword-clustering` with Search Console data. Until then,
Google Search Console alone is the richest free signal — export queries/pages
CSVs into `seo/gsc/` and cluster from those.
