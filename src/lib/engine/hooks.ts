import { APPROVED, DELIVERED, median, viewsOf, type EngineSub } from "./types";

// The playbook: which caption hooks and formats actually pull views on this
// board. A caption is the only creative signal we hold for every clip
// (oEmbed title), so the engine tags each one with plain, explainable traits
// and compares median views with vs. without the trait. No black box: every
// insight carries its sample size and both medians.

export type HookTrait =
  | "pov"
  | "question"
  | "payoff"
  | "bold_claim"
  | "list"
  | "story"
  | "reaction"
  | "short_caption"
  | "long_caption"
  | "heavy_hashtags"
  | "tags_artist"
  | "emoji";

export const TRAIT_LABEL: Record<HookTrait, string> = {
  pov: "POV opener",
  question: "Asks a question",
  payoff: "Promises a payoff (“wait for it”, “the drop”)",
  bold_claim: "Bold claim (“made for this”, “nobody told them”)",
  list: "Numbered / list hook",
  story: "Story opener (“when…”, “me when…”)",
  reaction: "Reaction framing",
  short_caption: "Short caption (≤ 40 chars)",
  long_caption: "Long caption (> 100 chars)",
  heavy_hashtags: "6+ hashtags",
  tags_artist: "Tags the artist (@)",
  emoji: "Uses emoji",
};

const RX: [HookTrait, RegExp][] = [
  ["pov", /(^|\s)pov\b/i],
  ["question", /\?/],
  [
    "payoff",
    /wait (for|till|until)|watch (till|until|to the end)|the drop|stay till|till the end/i,
  ],
  [
    "bold_claim",
    /nobody|no one|made for|deserve|tell me|best .* ever|hits different|i can't|cinema|goes hard/i,
  ],
  ["list", /^\s*(\d+|top \d+)[\s.)]/i],
  ["story", /^\s*(me )?(when|that moment|the way|imagine)\b/i],
  ["reaction", /react(ing|ion)|first time (hearing|listening)/i],
  ["tags_artist", /@\w/],
  ["emoji", /\p{Extended_Pictographic}/u],
];

// Strip hashtags/mentions before measuring length — that's the hook the
// viewer reads, not the tag pile.
function hookText(caption: string) {
  return caption
    .replace(/[#@][\w.]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function traitsOf(caption: string | null): HookTrait[] {
  if (!caption) return [];
  const out: HookTrait[] = [];
  for (const [t, rx] of RX) if (rx.test(caption)) out.push(t);
  const text = hookText(caption);
  if (text.length > 0 && text.length <= 40) out.push("short_caption");
  if (text.length > 100) out.push("long_caption");
  if ((caption.match(/#[\w]+/g) ?? []).length >= 6) out.push("heavy_hashtags");
  return out;
}

export type Insight = {
  trait: HookTrait;
  label: string;
  n_with: number;
  n_without: number;
  median_with: number;
  median_without: number;
  lift: number; // median_with / median_without
  confidence: "strong" | "emerging" | "early";
  direction: "use" | "avoid";
  evidence: string;
};

export type Playbook = {
  sample: number; // clips the playbook learned from
  insights: Insight[];
  top: { caption: string; views: number; sub_id: string; handle: string | null }[];
};

// Which clips count as evidence: delivered with a caption and views on the
// meter. Rejected clips are kept — a rejected clip still tells us what the
// audience did with that hook.
function evidenceRows(subs: EngineSub[]) {
  return subs.filter((s) => DELIVERED.has(s.status) && s.oembed_title && viewsOf(s) > 0);
}

const MIN_EACH_SIDE = 3;

export function learnPlaybook(subs: EngineSub[]): Playbook {
  const rows = evidenceRows(subs).map((s) => ({ s, traits: new Set(traitsOf(s.oembed_title)) }));
  const insights: Insight[] = [];

  for (const trait of Object.keys(TRAIT_LABEL) as HookTrait[]) {
    const withT = rows.filter((r) => r.traits.has(trait)).map((r) => viewsOf(r.s));
    const without = rows.filter((r) => !r.traits.has(trait)).map((r) => viewsOf(r.s));
    if (withT.length < MIN_EACH_SIDE || without.length < MIN_EACH_SIDE) continue;
    const mw = median(withT);
    const mo = median(without);
    if (mo === 0) continue;
    const lift = mw / mo;
    // Ignore noise: a 20% wobble on a handful of clips is not a lesson.
    if (lift > 0.8 && lift < 1.25) continue;
    const smaller = Math.min(withT.length, without.length);
    const confidence: Insight["confidence"] =
      smaller >= 10 && (lift >= 1.5 || lift <= 0.67)
        ? "strong"
        : smaller >= 5
          ? "emerging"
          : "early";
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
    insights.push({
      trait,
      label: TRAIT_LABEL[trait],
      n_with: withT.length,
      n_without: without.length,
      median_with: mw,
      median_without: mo,
      lift: Math.round(lift * 100) / 100,
      confidence,
      direction: lift >= 1 ? "use" : "avoid",
      evidence: `${withT.length} clips with it: median ${fmt(mw)} views. ${without.length} without: ${fmt(mo)}. That's ${lift >= 1 ? `${lift.toFixed(1)}×` : `${(1 / lift).toFixed(1)}× fewer`}.`,
    });
  }

  const rank = { strong: 0, emerging: 1, early: 2 } as const;
  insights.sort(
    (a, b) =>
      rank[a.confidence] - rank[b.confidence] ||
      Math.abs(Math.log(b.lift)) - Math.abs(Math.log(a.lift)),
  );

  const top = evidenceRows(subs)
    .filter((s) => APPROVED.has(s.status))
    .sort((a, b) => viewsOf(b) - viewsOf(a))
    .slice(0, 3)
    .map((s) => ({
      caption: (s.oembed_title ?? "").slice(0, 160),
      views: viewsOf(s),
      sub_id: s.id,
      handle: s.tiktok_handle,
    }));

  return { sample: rows.length, insights, top };
}
