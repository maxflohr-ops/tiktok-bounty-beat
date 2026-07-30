import { describe, expect, it } from "vitest";

// Smoke test for the Bounty Board route.
// Runs against a running dev/preview server (default http://localhost:8080).
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8080";

function serverFnUrl(file: string, exportName: string) {
  const id = Buffer.from(JSON.stringify({ file: `${file}?tss-serverfn-split`, export: exportName }))
    .toString("base64")
    .replace(/=+$/, "");
  return `${BASE}/_serverFn/${id}`;
}

async function callServerFn(file: string, exportName: string) {
  const res = await fetch(serverFnUrl(file, exportName), {
    headers: { accept: "application/json", "x-tsr-serverfn": "true" },
  });
  const text = await res.text();
  return { status: res.status, text };
}

// The payload is a serialized stream; assert on the encoded key set rather than
// re-implementing the deserializer.
function keySets(text: string): string[][] {
  const payload = JSON.parse(text) as unknown;
  const out: string[][] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.k) && obj.k.every((k) => typeof k === "string")) out.push(obj.k as string[]);
    Object.values(obj).forEach(walk);
  };
  walk(payload);
  return out;
}

function hasKeys(text: string, keys: string[]) {
  return keySets(text).some((set) => keys.every((k) => set.includes(k)));
}

describe("Bounty Board smoke", () => {
  it("renders the /board route", async () => {
    const res = await fetch(`${BASE}/board`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain("Bounty Board");
    expect(html).not.toContain("This page didn't load");
    expect(html).not.toMatch(/Internal Server Error/i);
  });

  it("listPublicBounties returns bounty fields without error", async () => {
    const { status, text } = await callServerFn("/src/lib/bounties.functions.ts", "listPublicBounties_createServerFn_handler");
    expect(status).toBe(200);
    expect(hasKeys(text, ["result", "error", "context"])).toBe(true);
    expect(text).not.toContain('"error":{"t"');
    expect(
      hasKeys(text, [
        "id",
        "contract_no",
        "title",
        "sound_name",
        "reward_cash_cents",
        "payout_type",
        "status",
        "claims_count",
        "approved_count",
        "paid_out_cents",
      ]),
    ).toBe(true);
    // Public payload must never leak funding/Stripe internals.
    expect(text).not.toContain("funded_cash_cents");
    expect(text).not.toContain("stripe_customer_id");
  });

  it("leaderboard returns profile fields without error", async () => {
    const { status, text } = await callServerFn("/src/lib/me.functions.ts", "leaderboard_createServerFn_handler");
    expect(status).toBe(200);
    expect(text).not.toContain('"error":{"t"');
    const empty = hasKeys(text, ["result", "error", "context"]) && !text.includes("display_name");
    expect(empty || hasKeys(text, ["display_name", "tiktok_handle", "avatar_url", "points"])).toBe(true);
  });

  it("weeklyPayouts responds without error", async () => {
    const { status, text } = await callServerFn("/src/lib/me.functions.ts", "weeklyPayouts_createServerFn_handler");
    expect(status).toBe(200);
    expect(text).not.toContain('"error":{"t"');
    const empty = !text.includes("paid_cents");
    expect(empty || hasKeys(text, ["display_name", "tiktok_handle", "paid_cents"])).toBe(true);
  });
});
