import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { getMyStanding } from "@/lib/engine.functions";

const TIER_COPY = {
  fast_track: "Fast-track. Your deliveries go to the front of the review queue.",
  standard: "Standard. Keep approvals clean and views up to reach fast-track at 75.",
  watch: "Under watch. Fix what's costing you points below.",
  new: "New. Your score settles after 3 reviewed clips.",
} as const;

// The two-way half of curation, shown to the clipper: the same score staff
// see, broken into the parts that move it, plus their referral link.
export function MyStanding() {
  const fn = useServerFn(getMyStanding);
  const { data } = useQuery({ queryKey: ["myStanding"], queryFn: () => fn() });
  if (!data) return null;
  const link = data.ref_code ? `https://bountysounds.com/join?ref=${data.ref_code}` : null;
  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied.");
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  return (
    <div className="board-frame relative p-5">
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      <h2 className="label-cap silver text-center">Your standing</h2>
      {data.score ? (
        <>
          <p className="mt-2 text-center font-display text-3xl text-bone tabular-nums">
            {data.score.score}
            <span className="text-base text-bone-soft">/100</span>
          </p>
          <p className="mt-1 text-center text-xs text-bone-soft">{TIER_COPY[data.score.tier]}</p>
          <ul className="mt-3 space-y-1 text-xs text-bone-soft">
            {data.score.parts.map((p) => (
              <li key={p.label} className="flex justify-between gap-2">
                <span>
                  {p.label} <span className="opacity-70">· {p.detail}</span>
                </span>
                <span className="tabular-nums text-bone">
                  {p.points}/{p.max}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-center text-xs text-bone-soft">
          Take a contract and deliver a clip to get scored.
        </p>
      )}

      <div className="mt-4 border-t border-[var(--border)] pt-3">
        <p className="label-cap text-bone-soft">Bring a clipper</p>
        {link ? (
          <>
            <button
              type="button"
              onClick={copy}
              className="mt-2 flex w-full items-center justify-between gap-2 rounded border border-[var(--border)] px-2 py-1.5 text-left text-xs text-bone"
            >
              <span className="truncate">{link.replace("https://", "")}</span>
              <Copy className="h-3.5 w-3.5 shrink-0" />
            </button>
            <p className="mt-1 text-[11px] text-bone-soft">
              {data.referred} signed up with your link. Referral bonuses are awarded at review.
            </p>
          </>
        ) : (
          <p className="mt-1 text-[11px] text-bone-soft">
            Save your TikTok handle above to get a referral link.
          </p>
        )}
      </div>
    </div>
  );
}
