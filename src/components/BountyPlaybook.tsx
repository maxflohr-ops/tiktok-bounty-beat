import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBountyPlaybook } from "@/lib/engine.functions";

// "What's working" on a bounty: the engine's playbook, shown to clippers.
// Aggregates only, and silent until there's real evidence. An empty claim
// is worse than no claim.
export function BountyPlaybook({ bountyId }: { bountyId: string }) {
  const fn = useServerFn(getBountyPlaybook);
  const { data } = useQuery({
    queryKey: ["bountyPlaybook", bountyId],
    queryFn: () => fn({ data: { bounty_id: bountyId } }),
    staleTime: 5 * 60_000,
  });
  if (!data) return null;
  const { insights, top_captions, review } = data;
  const hasReview = review.grade !== "—" && review.median_review_hours !== null;
  if (insights.length === 0 && top_captions.length === 0 && !hasReview) return null;

  return (
    <div className="mt-6 border-t border-[var(--paper-dark)] pt-4">
      <div className="label-cap text-ink-soft">
        What's working · learned from {data.sample} clips
      </div>
      {insights.length ? (
        <ul className="mt-2 space-y-1 text-sm text-ink">
          {insights.map((i) => (
            <li key={i.trait}>
              <span className="font-semibold">{i.direction === "use" ? "Do:" : "Skip:"}</span>{" "}
              {i.label} <span className="text-xs text-ink-soft">({i.evidence})</span>
            </li>
          ))}
        </ul>
      ) : null}
      {top_captions.length ? (
        <div className="mt-3">
          <div className="text-xs text-ink-soft">Top hooks so far</div>
          <ul className="mt-1 space-y-1 text-sm italic text-ink">
            {top_captions.map((t) => (
              <li key={t.caption}>
                “{t.caption}”{" "}
                <span className="not-italic text-xs text-ink-soft">
                  · {t.views.toLocaleString()} views
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hasReview ? (
        <p className="mt-3 text-xs text-ink-soft">
          Reviews here take a median of {review.median_review_hours}h
          {review.approval_rate !== null
            ? ` · ${Math.round(review.approval_rate * 100)}% approved`
            : ""}
          .
        </p>
      ) : null}
    </div>
  );
}
