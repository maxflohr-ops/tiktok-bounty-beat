import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { LandingLayout, LandingSection, FaqList } from "@/components/LandingLayout";
import { InkSeal } from "@/components/ArtMarks";
import { PARTNERS, partnerGoHref } from "@/lib/partners";
import { formatPerViewRate } from "@/lib/rate";
import { BsMono } from "@/components/bs";

const CANONICAL = "https://bountysounds.com/for-editors";
const TITLE = "UGC Creator Jobs & TikTok Editing Bounties — Get Paid Per View";
const DESCRIPTION =
  "Real UGC creator jobs for TikTok editors. Claim a bounty on a sound, stream, or keynote, post your edit, and get paid per verified view via PayPal or USDC.";

const FAQ = [
  {
    q: "How does payment work?",
    a: "Every bounty posts its purse and rate before you start — most pay per verified view, some pay flat per approved clip. You claim a slot, post the clip from your own TikTok, and its views count for the bounty's counting window, usually 14 days from delivery. At the close, views are verified and the payout goes to your PayPal or a USDC wallet, your choice.",
  },
  {
    q: "How much can I earn clipping?",
    a: "It depends entirely on the rate and how many views your clips verify — the math is public on every bounty before you commit: rate times verified views, paid from the posted purse. We don't publish typical earnings because there's no such thing yet; the board shows every live rate.",
  },
  {
    q: "Do I need experience to start?",
    a: "No. If you can cut a vertical clip with subtitles in a phone or desktop editor, you can start today. Each bounty carries its own brief, and the clipper toolkit on every bounty links free tools for grabbing and cutting source footage.",
  },
  {
    q: "How long until my first payout?",
    a: "Your clip's views count for the bounty's counting window — usually 14 days from delivery. After the window closes, verification and payout usually complete within [TBD] days.",
  },
  {
    q: "What kind of work is this?",
    a: "TikTok edits built on a campaign's sound, stream, or keynote footage. If you already make edits for fun, this pays for them.",
  },
  {
    q: "Do I need followers?",
    a: "No. Small accounts with viral edits out-earn big accounts posting filler. Views are what pay.",
  },
];

export const Route = createFileRoute("/for-editors")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: ForEditors,
});

type Bounty = Awaited<ReturnType<typeof listPublicBounties>>[number];

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function rate(b: Bounty) {
  if (b.payout_type === "per_1k_views" && b.reward_cash_cents > 0)
    return formatPerViewRate(b.reward_cash_cents, b.currency, true);
  if (b.reward_cash_cents > 0) return `${money(b.reward_cash_cents, b.currency)} per approved clip`;
  if (b.reward_points > 0) return `${b.reward_points} pts per clip`;
  return "rate on the contract";
}

// The editor's read: what kind of cut this actually is, from our side of the table.
function editorsRead(b: Bounty) {
  const hint = `${b.source_assets_url ?? ""} ${b.title} ${b.description ?? ""}`;
  if (/twitch|stream/i.test(hint))
    return "Stream cut. Watch the VOD, pull the moments people quote. Energy beats polish.";
  if (/keynote|talk|conference|speech/i.test(hint))
    return "Keynote cut. Find the ninety seconds everyone will argue about.";
  if (/podcast|episode|\bep\b/i.test(hint))
    return "Podcast cut. Find the story inside the episode — hooks beat context.";
  return "Sound cut. The edit you'd make anyway — with this sound under it.";
}

function ForEditors() {
  const listFn = useServerFn(listPublicBounties);
  const { data: bounties = [] } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
    retry: false,
  });
  const live = bounties
    .filter((b) => b.status !== "expired" && b.status !== "fulfilled" && b.status !== "closed" && b.status !== "draft")
    .slice(0, 6);

  return (
    <LandingLayout
      eyebrow="for tiktok editors & UGC creators"
      h1="Get paid per view for the edits you already make"
      intro="Claim a contract, post from your own TikTok, cash in on verified views. Every bounty is visible to every editor, always. No paid tier, no gated board."
      primaryCta="claim a contract"
      primaryHref="/auth"
      primaryReturnTo="/board"
      secondaryCta="see the board"
      secondaryHref="/board"
    >
      <LandingSection title="Live campaigns, from the editor's side">
        {live.length === 0 ? (
          <p>Nothing live this minute — the board refills fast. Check the Bounty Board.</p>
        ) : (
          <ul className="space-y-4">
            {live.map((b) => (
              <li key={b.id} className="border border-[var(--color-bs-rule)] bg-white p-5">
                <Link to="/bounty/$id" params={{ id: b.id }} className="group block">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-bs-ink)] group-hover:underline">
                      {b.title}
                    </span>
                    <BsMono className="text-[var(--color-bs-accent)]">{rate(b)}</BsMono>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-bs-ink-soft)]">{editorsRead(b)}</p>
                  <p className="mt-2 text-xs text-[var(--color-bs-ink-mute)]">
                    {b.claims_count > 0 ? `${b.claims_count} editor${b.claims_count === 1 ? "" : "s"} on it` : "no one on it yet"}
                    {b.deadline ? ` · closes ${new Date(b.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </LandingSection>

      <LandingSection title="The deal">
        <ul className="list-disc space-y-2 pl-6">
          <li>Rates are printed on the contract — paid per verified view, pro-rata</li>
          <li>First come, first served; early on a fresh sound wins</li>
          <li>Dispute flow if your view count doesn't match ours</li>
          <li>Payouts via PayPal or USDC — your pick</li>
        </ul>
      </LandingSection>

      <LandingSection title="Toolkit">
        <ul className="list-disc space-y-2 pl-6">
          {Object.entries(PARTNERS).filter(([, p]) => p.kit !== false).map(([id, p]) => (
            <li key={id}>
              <a
                href={partnerGoHref(id)}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="underline hover:text-bone"
              >
                {p.name}
              </a>{" "}
              — {p.blurb}
            </li>
          ))}
          <li>Every contract links its exact TikTok sound — post with that one</li>
        </ul>
      </LandingSection>

      <LandingSection title="Questions">
        <FaqList items={FAQ} />
      </LandingSection>

      <div className="flex justify-center pt-2">
        <InkSeal className="w-36 opacity-80" />
      </div>
    </LandingLayout>
  );
}
