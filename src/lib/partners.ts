// Every third-party tool we push people toward, in one place.
// When an affiliate program approves us, paste the tracking URL into
// affiliateUrl and every link on the site switches over — components all
// route through /api/go/<id>, which also logs the click to the event stream.
export type Partner = {
  name: string;
  blurb: string;
  url: string;
  // Paste the affiliate/tracking URL here when approved; null = plain link.
  affiliateUrl: string | null;
  // false keeps it out of the clipper toolkits (still reachable via /api/go/).
  kit?: boolean;
};

export const PARTNERS: Record<string, Partner> = {
  cobalt: {
    name: "Cobalt",
    blurb: "grab the source video or VOD",
    url: "https://cobalt.tools",
    affiliateUrl: null, // donation-supported open source — no affiliate program
  },
  "opus-clip": {
    name: "Opus Clip",
    blurb: "rough-cut long streams into candidates",
    url: "https://www.opus.pro",
    affiliateUrl: null, // has an affiliate program — paste the tracking URL once approved
  },
  capcut: {
    name: "CapCut",
    blurb: "edit and caption, mobile or desktop",
    url: "https://www.capcut.com",
    affiliateUrl: null, // affiliate program runs through impact.com — paste the tracking URL once approved
  },
  descript: {
    name: "Descript",
    blurb: "cut long recordings by editing the transcript",
    url: "https://www.descript.com",
    affiliateUrl: null, // affiliate program via PartnerStack — paste the tracking URL once approved
  },
  riverside: {
    name: "Riverside",
    blurb: "record your own show, auto-clip the highlights",
    url: "https://riverside.fm",
    affiliateUrl: null, // affiliate program on their site — paste the tracking URL once approved
  },
  clipping: {
    name: "Clipping.net",
    blurb: "more paid campaigns — join our clipping team",
    url: "https://clipping.net/auth/login?ref=TGWX7EfXTb",
    // The URL *is* the team/referral link — overrides on team earnings.
    affiliateUrl: "https://clipping.net/auth/login?ref=TGWX7EfXTb",
  },
  // Not a clipper tool: the quiet upstream funnel for campaigns bigger than a
  // board listing. Linked from the funder-facing pages only.
  florra: {
    name: "Florra",
    blurb: "campaigns bigger than a board",
    url: "https://florra.club",
    affiliateUrl: null,
    kit: false,
  },
};

export function partnerGoHref(id: keyof typeof PARTNERS | string) {
  return `/api/go/${id}`;
}
