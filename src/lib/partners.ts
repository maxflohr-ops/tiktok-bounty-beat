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
};

export const PARTNERS: Record<string, Partner> = {
  cobalt: {
    name: "Cobalt",
    blurb: "grab the source video or VOD",
    url: "https://cobalt.tools",
    affiliateUrl: null, // donation-funded open source — no affiliate program
  },
  "opus-clip": {
    name: "Opus Clip",
    blurb: "rough-cut long streams into candidates",
    url: "https://www.opus.pro",
    affiliateUrl: null, // has an affiliate program — paste the tracking URL once approved
  },
};

export function partnerGoHref(id: keyof typeof PARTNERS | string) {
  return `/api/go/${id}`;
}
