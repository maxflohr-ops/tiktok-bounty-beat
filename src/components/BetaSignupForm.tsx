import { useState } from "react";
import { toast } from "sonner";

// iOS beta waitlist capture. Subscribes straight to the Klaviyo list that
// drives the "Beta Welcome" flow (welcome email now, TestFlight invite when
// the build ships) via Klaviyo's public client-subscribe API — no server fn,
// no secret key.
const KLAVIYO_COMPANY_ID = "QXb5XX";
const BETA_LIST_ID = "TiXMTs";

export function BetaSignupForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(
        `https://a.klaviyo.com/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", revision: "2024-10-15" },
          body: JSON.stringify({
            data: {
              type: "subscription",
              attributes: {
                custom_source: "bountysounds.com/app",
                profile: { data: { type: "profile", attributes: { email } } },
              },
              relationships: { list: { data: { type: "list", id: BETA_LIST_ID } } },
            },
          }),
        },
      );
      if (!res.ok) throw new Error("Could not save that — try again.");
      setDone(true);
      toast.success("On the roster. Watch your inbox for the TestFlight invite.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <p className="mt-5 text-sm text-bone-soft">
        ✓ You're on the beta roster — the invite lands in your inbox.
      </p>
    );
  return (
    <form onSubmit={submit} className="mx-auto mt-5 flex max-w-sm items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email for the iOS beta waitlist"
        className="bone-input flex-1 text-sm"
      />
      <button type="submit" disabled={busy} className="silver-btn whitespace-nowrap text-sm disabled:opacity-60">
        {busy ? "saving…" : "join the beta"}
      </button>
    </form>
  );
}
