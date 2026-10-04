// Referral code capture, client side. ?ref=<handle> on any landing URL is
// kept once per browser (first wins, like attribution) and credited by the
// server on the first sign-in.
const KEY = "bs_ref_v1";
const SENT = "bs_ref_sent_v1";

export function captureReferral() {
  try {
    if (typeof window === "undefined" || localStorage.getItem(KEY)) return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^@?[A-Za-z0-9._]{2,40}$/.test(ref)) localStorage.setItem(KEY, ref);
  } catch {
    // storage unavailable — referrals are best-effort
  }
}

export function pendingReferral(): string | null {
  try {
    if (localStorage.getItem(SENT)) return null;
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function markReferralSent() {
  try {
    localStorage.setItem(SENT, "1");
  } catch {
    // ignore
  }
}
