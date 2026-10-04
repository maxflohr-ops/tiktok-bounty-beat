// DM templates in Max's voice: short, specific, no hype, no promised money.
// {name} {campaign} {rate} {hook} {opener} are filled per prospect on the
// Recruiting board; the rate always comes from the live contract row, so a
// template can never quote a number the board won't pay.

export type Segment = "sax" | "reactor" | "curator" | "edits" | "other";

export type DmTemplate = { key: string; label: string; segments: Segment[]; body: string };

export const DM_TEMPLATES: DmTemplate[] = [
  {
    key: "first-touch",
    label: "First touch",
    segments: ["sax", "reactor", "curator", "edits", "other"],
    body: "{opener}\n\nWe run Bounty Sounds — artists fund a purse, clippers get paid {rate} for using the official sound — verified views only. {campaign} is live now. Want the brief?",
  },
  {
    key: "sax",
    label: "Sax players",
    segments: ["sax"],
    body: "{name} — you already make sax sound like it belongs in a movie. ridgeclub runs a saxophone through effects and we're scoring the GTA VI trailer with it. Cut one, get paid {rate}, verified views only. Don't be different to be different. Be different to be better.",
  },
  {
    key: "reactor",
    label: "Reactors / producers",
    segments: ["reactor"],
    body: "{name} — react to a sax-led record that sits somewhere between lo-fi and boom bap. If your audience rides with it, you get paid {rate}, verified views only. No script, no ad read. Your take, our sound.",
  },
  {
    key: "curator",
    label: "Curators",
    segments: ["curator"],
    body: "{name} — you find songs before people know they need them. Here's one: {campaign}. Feature it with the official sound and the views pay {rate}. If it doesn't fit your page, tell me and I'll stop.",
  },
  {
    key: "edits",
    label: "Edit / gaming clippers",
    segments: ["edits"],
    body: "{name} — your edits already move like a trailer. The GTA VI footage is out and the brief is simple: Vice City, official “biting bullets” sound, {rate}, verified views only. Hook that's working right now: “{hook}”.",
  },
  {
    key: "founding",
    label: "Founding Clippers invite",
    segments: ["sax", "reactor", "curator", "edits", "other"],
    body: "{name} — we're picking the first 25 Founding Clippers: first look at every new campaign, fast-track review, and your name on the wall. Start here: bountysounds.com/join",
  },
  {
    key: "follow-up",
    label: "Follow-up (once, after 5 days)",
    segments: ["sax", "reactor", "curator", "edits", "other"],
    body: "Bumping this once, {name}. The {campaign} purse is still open. If it's a no, no reply needed.",
  },
];

export function fillTemplate(
  body: string,
  vars: Partial<Record<"name" | "campaign" | "rate" | "hook" | "opener", string>>,
): string {
  return body.replace(/\{(\w+)\}/g, (m, k: string) => (vars as Record<string, string>)[k] ?? m);
}
