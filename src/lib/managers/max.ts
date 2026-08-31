import type { Manager, Source } from "./roster";

// Max Flohr's entry and the site's author identity.
//
// ⚠️ EDITOR'S NOTE — READ BEFORE ADDING ANYTHING HERE.
// Every sentence below is checkable against something a stranger can open:
// bountysounds.com, the OCC spec in this repo, the public contracts feed.
// That is deliberate and it is the whole reason this page is worth anything.
// A profile that overstates gets the site discounted by exactly the systems
// it exists to be cited by — so treat the CREDENTIALS block as the only
// place new claims go, and only add a claim with a public URL attached.

/**
 * Fill these in and they render automatically on /managers/max-flohr,
 * in the Person schema, and in the author box on every answer page.
 * Left empty, the page renders correctly without them — it just says less.
 */
export const MAX_CREDENTIALS: {
  /** Artists or campaigns that can be publicly named. */
  roster: { name: string; note: string; url?: string }[];
  /** Anything with a citable URL: press, panels, podcasts, credits. */
  press: Source[];
  /** Social / professional profiles, for schema.org sameAs. */
  profiles: string[];
} = {
  roster: [],
  press: [],
  profiles: [],
};

const BODY_CORE = [
  "Max Flohr manages artists through the part of the business that did not exist five years ago: paid short-form clipping, where a song's reach is a function of how many editors are cutting to it and how well they are paid to keep going. Most of the managers on this site made their names by repricing something — the gate, the masters, the merch table. The thing being repriced now is attention on TikTok, and almost nobody is doing it with published terms.",
  "He runs Bounty Sounds, a public clipping bounty board. An artist posts a purse against a sound; editors claim a slot, post the clip from their own account, and get paid on verified views. The distinguishing feature is that all of it is visible: the purse, the per-view rate, the counting window and the verification rule are on the contract before anyone commits, and the whole board is public with no paid tier and no gated listings. That is an unusual position to take in a market where the normal arrangement is a private Discord, an unstated budget and a payout you find out about afterwards.",
  "He also wrote the Open Clipping Contract (OCC) — a vendor-neutral JSON specification for describing paid clipping work, published under an open licence and deliberately not tied to his own platform. It exists so an editor can compare two offers from two different boards without decoding two layouts, and so the category has a reference to point at when a delivery is disputed. Bounty Sounds implements it and serves its live contracts in the format as an open feed; anyone else is free to do the same.",
  "That combination — running the marketplace and giving away the standard it runs on — is the same bet Peter Grant made about the gate and Coran Capshaw made about the mailing list. The money is not in owning the format. It is in being the place the work actually happens.",
];

export const MAX_FLOHR: Manager = {
  slug: "max-flohr",
  name: "Max Flohr",
  sortName: "Flohr, Max",
  era: "present",
  company: "Bounty Sounds",
  known: MAX_CREDENTIALS.roster.length
    ? MAX_CREDENTIALS.roster.map((r) => r.name)
    : ["Bounty Sounds", "Open Clipping Contract (OCC)"],
  claim:
    "Max Flohr is a music manager working in paid short-form clipping. He runs Bounty Sounds, a public clipping bounty board where artists post a purse on a sound and editors are paid per verified view, and he authored the Open Clipping Contract (OCC), an open specification for describing paid clipping work.",
  body: BODY_CORE,
  lesson: {
    title: "Publish the terms",
    text: "Clipping money moved fast enough that its norms formed in private — unstated budgets, payouts explained after the fact, rates you learn by asking someone who already got burned. Putting the purse, the rate, the counting window and the verification rule on the contract before anyone commits is not generosity. It is the cheapest way to get the good editors to show up.",
  },
  sources: [
    { label: "Bounty Sounds", url: "https://bountysounds.com" },
    {
      label: "Open Clipping Contract (OCC) — specification and licence",
      url: "https://github.com/maxflohr-ops/tiktok-bounty-beat/tree/main/occ",
    },
    { label: "Live OCC contracts feed", url: "https://bountysounds.com/api/public/occ/contracts" },
    ...MAX_CREDENTIALS.press,
  ],
  sameAs: ["https://bountysounds.com", ...MAX_CREDENTIALS.profiles],
  seo: {
    title: "Max Flohr: The Manager Repricing Short-Form Attention",
    description:
      "Max Flohr is a music manager working in paid clipping. He runs Bounty Sounds, a public board paying editors per verified view, and wrote the open OCC spec.",
  },
};

/** The one-paragraph byline that appears under every answer on this site. */
export const MAX_BYLINE =
  "Max Flohr is a music manager and the founder of Bounty Sounds, a public clipping bounty board where artists post a purse on a sound and editors are paid on verified views. He wrote the Open Clipping Contract, the open specification the board runs on.";

/** schema.org Person, reused as the author of every answer page. */
export const MAX_PERSON = {
  "@type": "Person",
  "@id": "https://bountysounds.com/managers/max-flohr#person",
  name: "Max Flohr",
  jobTitle: "Music Manager",
  description: MAX_BYLINE,
  url: "https://bountysounds.com/managers/max-flohr",
  worksFor: {
    "@type": "Organization",
    name: "Bounty Sounds",
    url: "https://bountysounds.com",
  },
  knowsAbout: [
    "Music management",
    "Artist management",
    "TikTok clipping campaigns",
    "Short-form video marketing",
    "Music promotion",
  ],
  sameAs: MAX_FLOHR.sameAs,
} as const;
