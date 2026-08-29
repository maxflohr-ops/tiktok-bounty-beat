// Identity crossover state for the Whop shell (WO-2). Registers the identity
// on mount (ensureWhopIdentity — registration, never a merge) and offers the
// explicit dual-credential link: the button works only when the viewer also
// holds a Bounty Sounds session on this origin, because linkWhopIdentity
// demands both the Supabase bearer and the Whop token on one request.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ensureWhopIdentity, linkWhopIdentity } from "@/lib/whop-identity.functions";

export function WhopIdentityCard() {
  const queryClient = useQueryClient();
  const ensureFn = useServerFn(ensureWhopIdentity);
  const linkFn = useServerFn(linkWhopIdentity);

  const identity = useQuery({
    queryKey: ["whop", "identity"],
    queryFn: () => ensureFn(),
    retry: false,
  });
  const link = useMutation({
    mutationFn: () => linkFn(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whop", "identity"] }),
  });

  if (identity.isPending || identity.isError) return null;

  if (identity.data.linked) {
    return (
      <p className="mb-4 rounded-lg border border-bone/15 bg-paper/5 px-4 py-2 text-xs text-bone-soft">
        Linked to your Bounty Sounds account — clips and payouts land in one ledger.
      </p>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-bone/15 bg-paper/5 px-4 py-3 text-xs text-bone-soft">
      <p>
        Not linked to a Bounty Sounds account yet. Linking needs you signed in to Bounty Sounds in
        this browser, then it's one tap — no emails compared, no accounts merged.
      </p>
      <button
        type="button"
        className="mt-2 rounded border border-bone/30 px-3 py-1 text-bone hover:bg-paper/10 disabled:opacity-50"
        onClick={() => link.mutate()}
        disabled={link.isPending}
      >
        {link.isPending ? "Linking…" : "Link my Bounty Sounds account"}
      </button>
      {link.isError ? (
        <p className="mt-2 text-[11px] text-bone-soft">{(link.error as Error).message}</p>
      ) : null}
    </div>
  );
}
