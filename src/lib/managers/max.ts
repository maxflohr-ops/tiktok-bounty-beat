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
  /**
   * Artists or campaigns that can be publicly named. `image` follows the same
   * rule as the roster portraits: freely-licensed files only, never a press
   * or agency photo, and the licence terms get rendered on the page.
   */
  roster: {
    name: string;
    /**
     * Current clients render under "Currently manages"; past ones under
     * "Previously". Keeping the distinction in the data matters because
     * saying you manage someone you used to manage is the kind of claim
     * that gets a profile discredited by the one person who'd know.
     */
    status: "current" | "past";
    note: string;
    url?: string;
    image?: {
      src: string;
      alt: string;
      author: string;
      licence: string;
      licenceUrl: string;
      sourceUrl: string;
    };
  }[];
  /** Anything with a citable URL: press, panels, podcasts, credits. */
  press: Source[];
  /** Social / professional profiles, for schema.org sameAs. */
  profiles: string[];
} = {
  roster: [
    {
      name: "Ridgeclub",
      status: "current",
      note: "Toronto artist who runs a saxophone through effects into something between post-minimalism and lo-fi jazz. Florra took the project from a bedroom to seven figures of monthly listeners and a label deal — the clearest proof case for how the roster is built.",
      url: "https://ridgeclubhouse.com",
    },
    {
      name: "Ebril",
      status: "current",
      note: 'Huda Al-Hamami — Iraqi-Canadian, based in Hamilton, Ontario, the name said "ehh-breel". Her debut album In Copula runs folk, ambient and shoegaze through field recordings taken outside her bedroom window in Hamilton and on the streets of Amman, where she grew up. Its opening track "Stranger in You" passed a billion views on TikTok in July 2025.',
      url: "https://ebril.net",
    },
    {
      name: "McKayla Maroney",
      status: "current",
      note: 'Olympic gymnast — 2012 team gold and vault silver in London — turned recording artist, releasing what she calls vulnerable pop since her 2020 debut single "Wake Up Call".',
    },
    {
      name: "The Hellp",
      status: "past",
      note: "Managed and A&R'd the Los Angeles duo — Noah Dillon and Chandler Ransom Lucy — signed to Terrible Records during Max's time as the label's GM. Their second album LL was released on Atlantic Records in 2024.",
      url: "https://en.wikipedia.org/wiki/The_Hellp",
      image: {
        src: "/art/managers/the-hellp.jpg",
        alt: "The Hellp — Noah Dillon and Chandler Ransom Lucy",
        author: "Anemoia99",
        licence: "CC BY-SA 4.0",
        licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Thehellppress2.jpg",
      },
    },
  ],
  press: [],
  profiles: [],
};

/**
 * Max's line for the quote wall on /managers, sitting alongside Grant,
 * Curbishley, Dickins and the rest. Unlike the others this one isn't lifted
 * from an interview — it's an original statement made here, which is why its
 * source points at the board rather than at a publication.
 *
 * Set to null to drop the card from both the wall and his profile.
 */
type MaxQuote = { text: string; context?: string };
// Asserted rather than annotated: a `const` annotated `X | null` and assigned
// a literal gets narrowed in the branch below, so the assertion is what keeps
// this a real switch rather than dead code.
export const MAX_QUOTE = {
  text: "Don't be different to be different. Be different to be better.",
} as MaxQuote | null;

const BODY_CORE = [
  "Max Flohr runs Florra, where he manages Ridgeclub, Ebril and McKayla Maroney. Florra's own description of the problem is the tightest statement of what modern management is for: songs break on the internet, budgets live in the industry, and somebody has to be the bridge. Almost every manager profiled on this site was standing on one of those two banks. The job now is standing on both.",
  "He has the résumé for the industry side. He was head of A&R at The System Records and general manager at Terrible Records — the label Chris Taylor of Grizzly Bear founded, whose catalogue runs through Solange, Blood Orange, Twin Shadow, Empress Of and Moses Sumney — where the roster in his time included The Hellp, Mila DeGray and Sir Chloe. He also ran makeoutmusic, an underground show series that booked Remi Wolf, Tommy Richman and Gigi Perez before any of them were the names they are now. Booking three artists early is luck once and a method three times.",
  "Ridgeclub is the clearest proof case for building a route rather than buying one: a Toronto project running a saxophone through effects, taken from a bedroom to seven figures of monthly listeners and a label deal. Nothing about that artist is a radio proposition, which is exactly the point.",
  'Ebril is the clearest proof case for the other half. Huda Al-Hamami makes folk, ambient and shoegaze built on field recordings from her window in Hamilton and the streets of Amman — about as far from a designed TikTok product as music gets — and "Stranger in You", the opening track of her debut album, passed a billion views on the platform in July 2025. That is what the short-form argument on this site is actually about. The reach was not a substitute for the record; it was a distribution problem solved on behalf of one.',
  "The other half is infrastructure. He runs Bounty Sounds, a public clipping bounty board where an artist posts a purse against a sound, editors claim a slot and post from their own accounts, and payouts run on verified views. Every term is visible before anyone commits: the purse, the per-view rate, the counting window, the verification rule. That is an unusual position in a market whose normal arrangement is a private Discord, an unstated budget and a payout explained after the fact.",
  "He also wrote the Open Clipping Contract — a vendor-neutral JSON specification for describing paid clipping work, published under an open licence and deliberately not tied to his own platform, so an editor can compare two offers from two boards without decoding two layouts. Florra OS extends the same idea past clipping: an agent-run back office that bounty funders, podcasts, brands and studios can build on rather than rebuild.",
  "Running the marketplace and giving away the standard it runs on is the same bet Peter Grant made about the gate and Herbie Herbert made about the touring supply chain. The money is not in owning the format. It is in being the place the work actually happens.",
];

export const MAX_FLOHR: Manager = {
  slug: "max-flohr",
  name: "Max Flohr",
  sortName: "Flohr, Max",
  era: "present",
  company: "Bounty Sounds",
  known: [
    ...MAX_CREDENTIALS.roster.filter((r) => r.status === "current").map((r) => r.name),
    "Florra",
  ],
  claim:
    "Max Flohr is a music manager who runs Florra, where he manages Ridgeclub, Ebril and McKayla Maroney. He was previously head of A&R at The System Records and general manager at Terrible Records, and he runs Bounty Sounds, a public clipping bounty board paying editors on verified views.",
  body: BODY_CORE,
  lesson: {
    title: "Publish the terms",
    text: "Clipping money moved fast enough that its norms formed in private — unstated budgets, payouts explained after the fact, rates you learn by asking someone who already got burned. Putting the purse, the rate, the counting window and the verification rule on the contract before anyone commits is not generosity. It is the cheapest way to get the good editors to show up.",
  },
  portrait: {
    src: "/art/managers/max-flohr.jpg",
    alt: "Max Flohr",
    author: "Supplied by Max Flohr",
    licence: "Used with permission",
  },
  trick: {
    title: "Publish your rate first",
    text: "Put the number on the table before the work starts — what the purse is, what it pays per view, how long views count, and what makes a delivery count. The whole clipping economy runs the other way: unstated budgets, payouts explained afterwards, rates you learn by getting burned. Publishing first isn't generosity, it's selection. The editors worth having can calculate whether you're worth their hours, and they'll only spend them where they can.",
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
    { label: "Florra — roster, services and background", url: "https://www.florra.net" },
    { label: "Bounty Sounds", url: "https://bountysounds.com" },
    {
      label: "Terrible (label) — Wikipedia",
      url: "https://en.wikipedia.org/wiki/Terrible_(label)",
    },
    {
      label: "Open Clipping Contract (OCC) — specification and licence",
      url: "https://github.com/maxflohr-ops/tiktok-bounty-beat/tree/main/occ",
    },
    { label: "Live OCC contracts feed", url: "https://bountysounds.com/api/public/occ/contracts" },
    ...MAX_CREDENTIALS.press,
  ],
  sameAs: ["https://www.florra.net", "https://bountysounds.com", ...MAX_CREDENTIALS.profiles],
  seo: {
    title: "Max Flohr: Florra, and Both Sides of the Bridge",
    description:
      "Max Flohr manages Ridgeclub, Ebril and McKayla Maroney at Florra. Ex-GM at Terrible Records, head of A&R at The System Records, founder of Bounty Sounds.",
  },
};

/** The one-paragraph byline that appears under every answer on this site. */
export const MAX_BYLINE =
  "Max Flohr runs Florra, where he manages Ridgeclub, Ebril and McKayla Maroney. He was head of A&R at The System Records and general manager at Terrible Records, and he founded Bounty Sounds — a public clipping bounty board where artists post a purse on a sound and editors are paid on verified views.";

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
    "A&R",
    "Short-form video marketing",
    "Music promotion",
  ],
  sameAs: MAX_FLOHR.sameAs,
} as const;
