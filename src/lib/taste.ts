// Taste profile: a lightweight, local-only preference model used to rank the
// board. Stored in localStorage so it works before signup; no backend.

export type TasteProfile = {
  genres: string[];
  vibes: string[];
  reward: "steady" | "upside" | "either";
};

export const GENRES = [
  { id: "hiphop", label: "Hip-hop / rap", words: ["rap", "hip hop", "hip-hop", "trap", "drill", "freestyle"] },
  { id: "electronic", label: "Electronic / EDM", words: ["edm", "house", "techno", "electronic", "dnb", "drum and bass", "dubstep", "rave"] },
  { id: "phonk", label: "Phonk / underground", words: ["phonk", "underground", "memphis", "drift"] },
  { id: "pop", label: "Pop", words: ["pop", "hook", "chorus", "radio"] },
  { id: "rnb", label: "R&B / soul", words: ["r&b", "rnb", "soul", "slow jam", "vocals"] },
  { id: "indie", label: "Indie / alt", words: ["indie", "alt", "alternative", "bedroom", "lo-fi", "lofi"] },
  { id: "rock", label: "Rock / metal", words: ["rock", "metal", "punk", "guitar", "riff"] },
  { id: "latin", label: "Latin / afro", words: ["latin", "reggaeton", "afro", "afrobeat", "amapiano", "dembow"] },
] as const;

export const VIBES = [
  { id: "high_energy", label: "High energy", words: ["hype", "energy", "hard", "fast", "gym", "workout", "sports"] },
  { id: "chill", label: "Chill / ambient", words: ["chill", "ambient", "calm", "smooth", "vibe", "aesthetic", "study"] },
  { id: "dark", label: "Dark / moody", words: ["dark", "moody", "night", "haunting", "eerie", "cinematic"] },
  { id: "feel_good", label: "Feel-good / fun", words: ["fun", "feel good", "feel-good", "happy", "summer", "dance", "meme", "comedy"] },
] as const;

const KEY = "bs_taste_v1";

export function loadTaste(): TasteProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!Array.isArray(p.genres) || !Array.isArray(p.vibes)) return null;
    return { genres: p.genres, vibes: p.vibes, reward: p.reward ?? "either" };
  } catch {
    return null;
  }
}

export function saveTaste(p: TasteProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage unavailable — ranking simply stays off
  }
}

export function clearTaste() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

type RankableBounty = {
  title: string;
  description: string;
  sound_name: string;
  artist_song?: string | null;
  payout_type: string;
};

// Score a bounty against a profile. Genre hits weigh most (they say what the
// sound is), vibe hits refine, payout preference nudges. 0 = no signal.
export function scoreBounty(profile: TasteProfile, b: RankableBounty): number {
  const text = `${b.title} ${b.description} ${b.sound_name} ${b.artist_song ?? ""}`.toLowerCase();
  let score = 0;
  for (const g of GENRES) {
    if (!profile.genres.includes(g.id)) continue;
    for (const w of g.words) if (text.includes(w)) { score += 3; break; }
  }
  for (const v of VIBES) {
    if (!profile.vibes.includes(v.id)) continue;
    for (const w of v.words) if (text.includes(w)) { score += 2; break; }
  }
  if (profile.reward === "steady" && b.payout_type === "flat") score += 1;
  if (profile.reward === "upside" && b.payout_type === "per_1k_views") score += 1;
  return score;
}
