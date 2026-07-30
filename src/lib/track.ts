// Conversion events for GTM + Meta Pixel. Defined but NOT yet wired to any
// live trigger — call sites come later, per work order. Both helpers no-op
// until real container/pixel IDs are set in src/routes/__root.tsx.

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

function push(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer?.push({ event, ...params });
  window.fbq?.("trackCustom", event, params);
}

// Conversion 1: an editor seizes a bounty (claim created).
export function trackBountySeized(params: { bounty_id: string; clips: number }) {
  push("bounty_seized", params);
}

// Conversion 2: a creator posts a purse (listing submitted on /list-sound).
export function trackPursePosted(params: { listing_type: string }) {
  push("purse_posted", params);
}
