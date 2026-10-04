import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";
import { BsLoading } from "@/components/bs";
import { listAllBountiesStaff } from "@/lib/bounties.functions";
import { FLAGSHIP } from "@/lib/flagship";
import { formatPerViewRate } from "@/lib/rate";
import { importProspectSeed, listProspects, updateProspect } from "@/lib/recruiting.functions";
import { FOUNDING_SEATS, STAGES, type Stage } from "@/lib/recruiting/stages";
import { DM_TEMPLATES, fillTemplate, type Segment } from "@/lib/recruiting/templates";
import { DeskFrame, Pill } from "./DeskFrame";
import { usd } from "./format";

// Recruiting board: researched prospects moved stage to stage by hand.
// Nothing here sends a message — "copy DM" puts the text on your clipboard
// and you send it yourself from the creator's platform.

type Prospect = {
  id: string;
  name: string;
  handle: string;
  platform: string;
  profile_url: string;
  segment: string;
  campaign: string | null;
  followers: string | null;
  fit: string | null;
  opener: string | null;
  contact: string | null;
  stage: string;
  founding: boolean;
  notes: string | null;
  last_touch_at: string | null;
};

type Bounty = {
  id: string;
  title: string;
  status: string;
  payout_type: "flat" | "per_1k_views";
  reward_cash_cents: number;
};

const STAGE_LABEL: Record<Stage, string> = {
  prospect: "Prospect",
  contacted: "Contacted",
  replied: "Replied",
  onboarded: "Onboarded",
  active: "Active clipper",
  passed: "Passed",
};

const rateOf = (b: Bounty | undefined) =>
  !b
    ? "a per-view rate"
    : b.payout_type === "per_1k_views"
      ? formatPerViewRate(b.reward_cash_cents)
      : `${usd(b.reward_cash_cents)} per approved clip`;

// Prospect research tags a campaign by key; match it to a live contract row.
function defaultBounty(bounties: Bounty[], campaign: string | null) {
  const key = (campaign ?? "").toLowerCase();
  const word = key.includes("ebril") ? "ebril" : key.includes("max") ? "stream" : "ridgeclub";
  return bounties.find((b) => b.title.toLowerCase().includes(word)) ?? bounties[0];
}

export function RecruitingPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listProspects);
  const importFn = useServerFn(importProspectSeed);
  const bountiesFn = useServerFn(listAllBountiesStaff);
  const { data, isLoading, error } = useQuery({ queryKey: ["prospects"], queryFn: () => listFn() });
  const { data: allBounties = [] } = useQuery({
    queryKey: ["bountiesStaff"],
    queryFn: () => bountiesFn(),
  });
  const bounties = useMemo(
    () => (allBounties as unknown as Bounty[]).filter((b) => b.status === "active"),
    [allBounties],
  );
  const [busy, setBusy] = useState(false);

  if (isLoading) return <BsLoading label="opening the pipeline" />;
  if (error || !data)
    return (
      <p className="text-sm text-red-700">
        {error instanceof Error ? error.message : "Pipeline unavailable."}
      </p>
    );

  if (!data.ready)
    return (
      <DeskFrame>
        <h2 className="label-cap silver">Recruiting</h2>
        <p className="mt-2 text-sm text-bone">
          The recruiting tables aren't in the database yet. Apply{" "}
          <code className="text-xs">
            supabase/migrations/20261004120000_recruiting_pipeline.sql
          </code>
          , then come back and load the {data.seedSize} researched prospects.
        </p>
      </DeskFrame>
    );

  const prospects = data.prospects as Prospect[];
  const founding = prospects.filter((p) => p.founding).length;

  const runImport = async () => {
    setBusy(true);
    try {
      const r = await importFn();
      toast.success(r.added ? `Added ${r.added} prospects.` : "Everyone's already on the board.");
      qc.invalidateQueries({ queryKey: ["prospects"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-bone">Recruiting</h2>
          <p className="script-note text-lg text-bone-soft">
            You send every message. The board keeps score.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <div className="label-cap text-bone-soft">Founding Clippers</div>
            <div className="font-display text-xl silver tabular-nums">
              {founding}/{FOUNDING_SEATS}
            </div>
          </div>
          {data.seedSize > 0 ? (
            <button type="button" className="ink-btn" disabled={busy} onClick={runImport}>
              {busy ? "loading…" : `load researched prospects (${data.seedSize})`}
            </button>
          ) : null}
        </div>
      </div>

      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
        {STAGES.map((stage) => {
          const col = prospects.filter((p) => p.stage === stage);
          return (
            <div key={stage} className="w-64 shrink-0 snap-start">
              <div className="mb-2 flex items-center justify-between border-b border-[var(--border)] pb-1">
                <span className="label-cap text-bone">{STAGE_LABEL[stage]}</span>
                <span className="text-xs tabular-nums text-bone-soft">{col.length}</span>
              </div>
              <ul className="space-y-3">
                {col.map((p) => (
                  <ProspectCard key={p.id} p={p} bounties={bounties} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <DeskFrame>
        <h3 className="label-cap silver">Referral program</h3>
        <p className="mt-1 text-xs text-bone-soft">
          Any clipper's link is <code>bountysounds.com/join?ref=&lt;their handle&gt;</code>. New
          sign-ups are credited on first sign-in; bonuses are awarded by staff at review, never
          automatically.
        </p>
        <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
          {data.referrers.map((r) => (
            <li key={r.referrer_id} className="flex justify-between py-2">
              <span className="text-bone">@{r.ref_code}</span>
              <span className="tabular-nums text-bone-soft">
                {r.referred} referred · last {new Date(r.last).toLocaleDateString()}
              </span>
            </li>
          ))}
          {data.referrers.length === 0 ? (
            <li className="py-3 text-bone-soft">No referrals yet.</li>
          ) : null}
        </ul>
      </DeskFrame>
    </div>
  );
}

function ProspectCard({ p, bounties }: { p: Prospect; bounties: Bounty[] }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateProspect);
  const templates = DM_TEMPLATES.filter((t) => t.segments.includes(p.segment as Segment));
  const [tpl, setTpl] = useState(templates[0]?.key ?? "first-touch");
  const [bountyId, setBountyId] = useState(defaultBounty(bounties, p.campaign)?.id ?? "");
  const [notes, setNotes] = useState(p.notes ?? "");

  const save = async (patch: { stage?: Stage; founding?: boolean; notes?: string | null }) => {
    try {
      await updateFn({ data: { id: p.id, ...patch } });
      qc.invalidateQueries({ queryKey: ["prospects"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const copyDm = async () => {
    const b = bounties.find((x) => x.id === bountyId);
    const body = DM_TEMPLATES.find((t) => t.key === tpl)?.body ?? "";
    const text = fillTemplate(body, {
      name: p.name.split(" ")[0],
      campaign: b?.title ?? "the campaign",
      rate: rateOf(b),
      hook: FLAGSHIP.hooks[0],
      opener: p.opener ?? `${p.name.split(" ")[0]} — love what you're doing.`,
    });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("DM copied. Send it yourself, then mark them contacted.");
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  return (
    <li className="rounded-xl border border-[var(--border)] bg-white/70 p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-bone">{p.name}</p>
          <a
            href={p.profile_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-bone-soft underline"
          >
            {p.handle} · {p.platform} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <button
          type="button"
          title={p.founding ? "Founding Clipper" : "Make Founding Clipper"}
          onClick={() => save({ founding: !p.founding })}
          className={p.founding ? "text-amber-600" : "text-bone-soft"}
        >
          <Star className="h-4 w-4" fill={p.founding ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <Pill tone="quiet">{p.segment}</Pill>
        {p.followers ? <Pill tone="quiet">{p.followers.split(" (")[0]}</Pill> : null}
      </div>
      {p.opener ? <p className="mt-2 line-clamp-3 italic text-bone">“{p.opener}”</p> : null}
      {p.fit ? (
        <details className="mt-1 text-bone-soft">
          <summary className="cursor-pointer">why they fit</summary>
          <p className="mt-1">{p.fit}</p>
          {p.contact ? <p className="mt-1">Public contact: {p.contact}</p> : null}
        </details>
      ) : null}

      <div className="mt-2 grid gap-1">
        <select
          value={tpl}
          onChange={(e) => setTpl(e.target.value)}
          className="w-full min-w-0 rounded border border-[var(--border)] bg-transparent px-1 py-1"
        >
          {templates.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={bountyId}
          onChange={(e) => setBountyId(e.target.value)}
          className="w-full min-w-0 rounded border border-[var(--border)] bg-transparent px-1 py-1"
        >
          {bounties.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title.slice(0, 40)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={copyDm}
          className="ink-btn w-full justify-center px-2 py-1 text-xs"
        >
          <Copy className="h-3.5 w-3.5" /> copy DM
        </button>
        <select
          value={p.stage}
          onChange={(e) => save({ stage: e.target.value as Stage })}
          className="w-full min-w-0 rounded border border-[var(--border)] bg-transparent px-1 py-1"
          aria-label="Stage"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (p.notes ?? "") && save({ notes: notes || null })}
          placeholder="notes"
          rows={2}
          className="w-full min-w-0 rounded border border-[var(--border)] bg-transparent px-1 py-1"
        />
      </div>
      {p.last_touch_at ? (
        <p className="mt-1 text-[10px] text-bone-soft">
          moved {new Date(p.last_touch_at).toLocaleDateString()}
        </p>
      ) : null}
    </li>
  );
}
