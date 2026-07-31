// Pure helpers for verifying a delivered TikTok clip against a claim:
// the video must be posted by the claimed handle, using the contract's sound.

// TikTok sound pages look like https://www.tiktok.com/music/Some-Name-7123456789012345678
// The trailing digit run is the music ID.
export function parseMusicId(soundUrl: string | null | undefined): string | null {
  if (!soundUrl) return null;
  const m = soundUrl.match(/\/music\/[^/?#]*?(\d{15,20})(?:[/?#]|$)/);
  return m ? m[1] : null;
}

// oEmbed author_url is https://www.tiktok.com/@handle — the unique handle,
// unlike author_name which is the free-text display nickname.
export function handleFromAuthorUrl(authorUrl: string | null | undefined): string | null {
  if (!authorUrl) return null;
  const m = authorUrl.match(/tiktok\.com\/@([a-zA-Z0-9_.]{1,24})(?:[/?#]|$)/);
  return m ? m[1].toLowerCase() : null;
}

// The video page embeds engagement counts as "stats" (numbers) or "statsV2"
// (strings). Pick the block that carries playCount — authorStats and music
// stats blocks don't have it — and read the counts out of it.
export type ClipStats = {
  views: number;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

export function statsFromHtml(html: string): ClipStats | null {
  const blocks = html.match(/"stats(?:V2)?"\s*:\s*\{[^{}]*"playCount"[^{}]*\}/g);
  if (!blocks || blocks.length === 0) return null;
  const block = blocks[0];
  const num = (name: string): number | null => {
    const m = block.match(new RegExp(`"${name}"\\s*:\\s*"?(\\d+)"?`));
    return m ? Number(m[1]) : null;
  };
  const views = num("playCount");
  if (views === null) return null;
  return { views, likes: num("diggCount"), comments: num("commentCount"), shares: num("shareCount") };
}

// Video page HTML embeds the music JSON. Only claim a definite verdict when the
// page clearly carries music data; otherwise return null (unverifiable).
export function musicIdInHtml(html: string, musicId: string): boolean | null {
  const hasMusicData = /"music(?:Id)?"\s*:/.test(html) || html.includes("/music/");
  if (!hasMusicData) return null;
  return (
    html.includes(`"id":"${musicId}"`) ||
    html.includes(`"musicId":"${musicId}"`) ||
    html.includes(`-${musicId}`) ||
    html.includes(`/music/${musicId}`)
  );
}
