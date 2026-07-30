// First-touch ad attribution, client side. Captured once per browser from the
// first URL that carries UTM params or ad click IDs, then attached to the
// signup event and any listing purchase so the Sheet shows which ad paid.
const KEY = "bs_attrib_v1";
const SENT = "bs_attrib_sent_v1";

const PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid", // Google Ads
  "ttclid", // TikTok Ads
] as const;

export type Attribution = Partial<Record<(typeof PARAM_KEYS)[number], string>> & {
  referrer?: string;
  landing?: string;
  captured_at?: string;
};

// Call on app mount. First touch wins — later visits never overwrite.
export function captureAttribution() {
  try {
    if (typeof window === "undefined" || localStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const a: Attribution = {};
    let hit = false;
    for (const k of PARAM_KEYS) {
      const v = params.get(k);
      if (v) {
        a[k] = v.slice(0, 200);
        hit = true;
      }
    }
    const ref = document.referrer;
    if (ref && !ref.includes(window.location.host)) {
      a.referrer = ref.slice(0, 300);
      hit = true;
    }
    if (!hit) return;
    a.landing = window.location.pathname;
    a.captured_at = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // storage unavailable — attribution is best-effort
  }
}

export function getAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

export function attributionSent(): boolean {
  try {
    return localStorage.getItem(SENT) === "1";
  } catch {
    return true;
  }
}

export function markAttributionSent() {
  try {
    localStorage.setItem(SENT, "1");
  } catch {
    // ignore
  }
}
