// Auto-link system: from ANY dropped sound link (Spotify / Apple Music) plus the
// campaign's artist + song text, derive the matching TikTok sound page and the
// YouTube Shorts sound page so clippers never have to hunt for them.

export type SoundLinkSource = {
  sound_name?: string | null;
  artist_song?: string | null;
  tiktok_sound_url?: string | null;
  source_assets_url?: string | null;
};

export type SoundLink = {
  platform: "spotify" | "apple" | "tiktok" | "youtube";
  label: string;
  url: string;
  /** true when we linked an exact sound page, false when it's an auto-matched search */
  exact: boolean;
};

const isSpotify = (u: string) => /(^|\/\/)([a-z]+\.)?spotify\.com\//i.test(u) || u.startsWith("spotify:");
const isApple = (u: string) => /music\.apple\.com\//i.test(u);

/** Pull a rough "artist song" phrase out of a Spotify/Apple URL slug. */
export function titleFromSoundUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const path = new URL(url).pathname;
    // apple: /us/album/some-album-name/12345  |  spotify: /track/ID (no words)
    const slug = path
      .split("/")
      .filter((s) => s && !/^\d+$/.test(s) && !/^[a-z]{2}$/i.test(s) && !/^(track|album|song|artist|playlist|music)$/i.test(s))
      .find((s) => /[a-z]{3}/i.test(s) && s.includes("-"));
    if (!slug) return null;
    return decodeURIComponent(slug).replace(/-/g, " ").trim();
  } catch {
    return null;
  }
}

/** Best available "artist — song" query text for a campaign. */
export function soundQuery(b: SoundLinkSource): string {
  const parts = [b.artist_song, b.sound_name].filter(Boolean) as string[];
  if (parts.length === 0) {
    const fromUrl = titleFromSoundUrl(b.source_assets_url);
    if (fromUrl) return fromUrl;
  }
  // Avoid "Artist Artist — Song" duplication.
  const uniq = parts.filter((p, i) => parts.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i);
  return uniq.join(" ").replace(/\s+/g, " ").trim();
}

export function tiktokSoundSearchUrl(query: string): string {
  return `https://www.tiktok.com/search/music?q=${encodeURIComponent(query)}`;
}

export function youtubeShortsSoundUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} shorts sound`)}&sp=EgIYAQ%253D%253D`;
}

/**
 * Every sound link for a campaign, in display order:
 * Spotify/Apple (whatever was dropped in) → TikTok sound → YouTube Shorts sound.
 * TikTok/YouTube are always present; exact when we have the real URL, otherwise
 * an auto-matched sound search built from the artist + song.
 */
export function soundLinks(b: SoundLinkSource): SoundLink[] {
  const links: SoundLink[] = [];
  const src = b.source_assets_url?.trim() || "";
  if (src && isSpotify(src)) links.push({ platform: "spotify", label: "spotify", url: src, exact: true });
  else if (src && isApple(src)) links.push({ platform: "apple", label: "apple music", url: src, exact: true });

  const query = soundQuery(b);
  const tiktok = b.tiktok_sound_url?.trim();
  if (tiktok) {
    links.push({ platform: "tiktok", label: "tiktok sound", url: tiktok, exact: true });
  } else if (query) {
    links.push({ platform: "tiktok", label: "tiktok sound", url: tiktokSoundSearchUrl(query), exact: false });
  }

  if (query) {
    links.push({ platform: "youtube", label: "youtube shorts sound", url: youtubeShortsSoundUrl(query), exact: false });
  }

  return links;
}
