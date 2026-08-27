// The flagship LIVE campaign: "biting bullets" × GTA VI.
// The row itself lives in the bounties table (seeded from bounties.functions),
// but the presentation extras — source footage, official sound buttons, the
// verbatim rule list and the hook bank — are campaign copy, so they live here
// and are matched onto the row by title.

export const FLAGSHIP_TITLE =
  "biting bullets by ridgeclub / Grand Theft Auto — Clipping Campaign";


export type FlagshipCopy = {
  rateLabel: string;
  rateLabelCompact: string;
  pursecents: number;
  capViews: number;
  platforms: { key: "tiktok" | "reels"; label: string }[];
  funder: string;
  hero: { image: string; alt: string };
  source: {
    youtube: string;
    youtubeId: string;
    youtubeTitle: string;
    netflix: string;
    note: string;
  };
  sounds: { label: string; url: string; required?: boolean }[];
  rules: string[];
  rightsNote: string;
  hooks: string[];
};

export const FLAGSHIP: FlagshipCopy = {
  rateLabel: "$1.00 per 1,000 verified views",
  rateLabelCompact: "$1 / 1k views",
  pursecents: 250000,
  capViews: 2_500_000,
  platforms: [
    { key: "tiktok", label: "TikTok" },
    { key: "reels", label: "Instagram Reels" },
  ],
  funder: "All My Life Productions",
  hero: {
    image: "https://img.youtube.com/vi/qq76pQsI1iw/maxresdefault.jpg",
    alt: "Grand Theft Auto VI: An Extended Look — Rockstar Games announcement",
  },
  source: {
    youtube: "https://www.youtube.com/watch?v=qq76pQsI1iw",
    youtubeId: "qq76pQsI1iw",
    youtubeTitle: "Grand Theft Auto VI: An Extended Look Coming August 27",
    netflix: "https://www.netflix.com/tudum/articles/grand-theft-auto-6-extended-first-look",
    note: "Full Extended Look hits Rockstar's YouTube channel Aug 27, 9pm ET — clip that too.",
  },
  sounds: [
    {
      label: "TikTok official sound",
      url: "https://www.tiktok.com/music/biting-bullets-7657072140283643921",
      required: true,
    },
    { label: "Spotify", url: "https://open.spotify.com/track/73YVRUhgQYEj7uUNF5LlMi" },
    { label: "Apple Music", url: "https://music.apple.com/us/song/biting-bullets/6789539679" },
    { label: "Artist TikTok — @ridgeclub", url: "https://www.tiktok.com/@ridgeclub" },
  ],
  rules: [
    "Clip must use the OFFICIAL \"biting bullets\" sound via the platform's sound picker (TikTok sound / Reels audio). Baked-in or re-uploaded audio doesn't count — the sound attribution IS the campaign.",
    "Caption must include @ridgeclub + #bitingbullets.",
    "Minimum clip length: 7 seconds.",
    "Link your account here BEFORE posting. Unlinked accounts produce unpayable views — no retroactive fix.",
    "Submit your live URL within 60 minutes of posting.",
    "One payout per unique edit — duplicates of another creator's edit are seized; first submission wins.",
    "Bot or purchased views: seized + banned from all future bounties.",
  ],
  rightsNote:
    "Rights note: trailer footage belongs to Rockstar/Netflix. Transformative edits (cropped, captioned, sped, reaction-framed) survive; straight re-uploads get taken down, and takedown risk is on the creator.",
  hooks: [
    "GTA VI but it's scored by a live saxophone",
    "the GTA 6 trailer with the song it actually deserved",
    "POV: Vice City at 3am",
    "they dropped the GTA 6 trailer on NETFLIX?",
    "this song was made for this trailer and nobody told them",
  ],
};

export function isFlagship(b: { title?: string | null } | null | undefined): boolean {
  return (b?.title ?? "").trim().toLowerCase() === FLAGSHIP_TITLE.toLowerCase();
}
