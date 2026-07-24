// Fire-and-forget notification fan-out: Airtable + Google Sheets + email alert.
// All destinations wrapped in try/catch so a broken sink never breaks the app.

const AIRTABLE_BASE = "appKSc7Gesrs4bGyq";
const AIRTABLE_TABLE = "tblVSz4TjewCkOLaP";
const SHEET_ID = "1rpDPb_96nc4mjATt2U0Iz8-k0dC8sof7JqCu3ZfBZ4k";
const SHEET_TAB = "Sheet1";
const ALERT_EMAIL = "maxflohr@allmylifeproductions.com";

export type EventPayload = {
  event: string; // e.g. "claim.created", "proof.delivered"
  actor?: string | null; // email/handle/user id
  reference?: string | null; // contract no / submission id / bounty title
  details?: Record<string, unknown>;
};

function gwHeaders(connectionKey: string) {
  return {
    Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

async function sendToAirtable(p: EventPayload, ts: string) {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key || !process.env.LOVABLE_API_KEY) return;
  const url = `https://connector-gateway.lovable.dev/airtable/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`;
  const body = {
    typecast: true,
    records: [
      {
        fields: {
          Event: p.event,
          Timestamp: ts,
          Actor: p.actor ?? "",
          Reference: p.reference ?? "",
          Details: JSON.stringify(p.details ?? {}, null, 2),
        },
      },
    ],
  };
  const res = await fetch(url, { method: "POST", headers: gwHeaders(key), body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    console.error(`[notify.airtable] ${res.status}: ${t}`);
  }
}

async function sendToSheet(p: EventPayload, ts: string) {
  const key = process.env.GOOGLE_SHEETS_API_KEY;
  if (!key || !process.env.LOVABLE_API_KEY) return;
  const range = `${SHEET_TAB}!A:E`;
  const url = `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const body = {
    values: [[ts, p.event, p.actor ?? "", p.reference ?? "", JSON.stringify(p.details ?? {})]],
  };
  const res = await fetch(url, { method: "POST", headers: gwHeaders(key), body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    console.error(`[notify.sheet] ${res.status}: ${t}`);
  }
}

async function sendEmailAlert(p: EventPayload, ts: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return;
  const subject = `[BountySounds] ${p.event}${p.reference ? ` — ${p.reference}` : ""}`;
  const lines = [
    `<p><strong>Event:</strong> ${p.event}</p>`,
    `<p><strong>When:</strong> ${ts}</p>`,
    p.actor ? `<p><strong>Actor:</strong> ${p.actor}</p>` : "",
    p.reference ? `<p><strong>Reference:</strong> ${p.reference}</p>` : "",
    `<pre style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap;font-family:monospace">${escapeHtml(
      JSON.stringify(p.details ?? {}, null, 2),
    )}</pre>`,
  ].filter(Boolean).join("");
  const html = `<div style="font-family:system-ui,sans-serif;color:#141210">${lines}</div>`;
  try {
    const { sendLovableEmail } = await import("@lovable.dev/email-js");
    await sendLovableEmail({
      apiKey: key,
      to: ALERT_EMAIL,
      subject,
      html,
    } as unknown as Parameters<typeof sendLovableEmail>[0]);
  } catch (err) {
    // Expected until an email domain is configured for the project.
    console.error("[notify.email]", err instanceof Error ? err.message : err);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export async function notify(p: EventPayload): Promise<void> {
  const ts = new Date().toISOString();
  try {
    await Promise.allSettled([sendToAirtable(p, ts), sendToSheet(p, ts), sendEmailAlert(p, ts)]);
  } catch (err) {
    console.error("[notify] unexpected:", err);
  }
}

// Fire-and-forget wrapper for use inside server functions without awaiting.
export function notifyAsync(p: EventPayload): void {
  notify(p).catch((err) => console.error("[notifyAsync]", err));
}
