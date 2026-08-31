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
  roster: [
    {
      name: "The Hellp",
      note: "Managed and A&R'd the Los Angeles duo — Noah Dillon and Chandler Ransom Lucy — whose second album LL was released on Atlantic Records in 2024.",
      url: "https://en.wikipedia.org/wiki/The_Hellp",
    },
  ],
  press: [],
  profiles: [],
};

/**
 * Max's line for the quote wall on /managers, sitting alongside Grant,
 * Curbishley, Dickins and the rest.
 *
 * ⚠️ Deliberately empty. Everyone else on that wall is quoted from a public
 * source, so this one has to be Max's actual words rather than something
 * written for him. Drop the sentence in and the card appears on the wall and
 * on his profile automatically; leave it empty and both simply omit it.
 */
type MaxQuote = { text: string; context?: string };
// Asserted rather than annotated: a `const` annotated `X | null` and assigned
// null gets narrowed to `never` in the truthy branch below, so the assertion
// is what keeps this a real switch rather than dead code.
export const MAX_QUOTE = null as MaxQuote | null;

const BODY_CORE = [
  "Max Flohr managed and A&R'd The Hellp, the Los Angeles duo of Noah Dillon and Chandler Ransom Lucy, whose second album LL came out on Atlantic Records in 2024. Two people with no musical background who started a band out of a fear of dying without ever having been in a cool one is not a project that survives being handed to the conventional machine, and it is a useful thing to have managed before arguing about how attention actually moves.",
  "Because that is the argument. Most of the managers on this site made their names by repricing something — the gate, the masters, the merch table, the mailing list. The thing being repriced now is short-form attention: a song's reach is largely a function of how many editors are cutting to it and how well they are paid to keep going. Almost nobody is doing that with published terms.",
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
  known: [...MAX_CREDENTIALS.roster.map((r) => r.name), "Bounty Sounds"],
  claim:
    "Max Flohr is a music manager who managed and A&R'd The Hellp. He runs Bounty Sounds, a public clipping bounty board where artists post a purse on a sound and editors are paid per verified view, and he authored the Open Clipping Contract (OCC), an open specification for describing paid clipping work.",
  body: BODY_CORE,
  lesson: {
    title: "Publish the terms",
    text: "Clipping money moved fast enough that its norms formed in private — unstated budgets, payouts explained after the fact, rates you learn by asking someone who already got burned. Putting the purse, the rate, the counting window and the verification rule on the contract before anyone commits is not generosity. It is the cheapest way to get the good editors to show up.",
  },
  ...(MAX_QUOTE
    ? {
        quote: {
          text: MAX_QUOTE.text,
          speaker: "Max Flohr",
          ...(MAX_QUOTE.context ? { context: MAX_QUOTE.context } : {}),
          source: { label: "Bounty Sounds", url: "https://bountysounds.com" },
        },
      }
    : {}),
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
      "Max Flohr managed and A&R'd The Hellp. He runs Bounty Sounds, a public board paying clip editors per verified view, and wrote the open OCC spec.",
  },
};

/** The one-paragraph byline that appears under every answer on this site. */
export const MAX_BYLINE =
  "Max Flohr is a music manager who managed and A&R'd The Hellp, and the founder of Bounty Sounds — a public clipping bounty board where artists post a purse on a sound and editors are paid on verified views. He wrote the Open Clipping Contract, the open specification the board runs on.";

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
