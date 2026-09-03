// Supabase stand-in for the smoke suite: GoTrue auth + enough PostgREST
// semantics for the board/claim/submit/dashboard flows. CI points the dev
// server at this (see .github/workflows/smoke.yml) so the smoke test runs
// deterministically without real Supabase credentials.
import http from "node:http";
import crypto from "node:crypto";

const tables = {
  bounties: [],
  submissions: [],
  profiles: [],
  user_roles: [],
  tiktok_accounts: [],
  events: [],
  sound_listings: [],
  payout_approvals: [],
  disputes: [],
  tax_profiles: [],
};
let contractNo = 0;
const users = new Map(); // email -> {id, email, password}
const toB64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

function makeSession(user) {
  const token = `${toB64u({ alg: "HS256", typ: "JWT" })}.${toB64u({
    sub: user.id,
    email: user.email,
    role: "authenticated",
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
    session_id: crypto.randomUUID(),
  })}.${toB64u({ sig: "mock" })}`;
  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: crypto.randomUUID(),
    user: {
      id: user.id,
      aud: "authenticated",
      role: "authenticated",
      email: user.email,
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

function userFromAuthHeader(req) {
  const h = req.headers.authorization ?? "";
  const token = h.replace(/^Bearer /, "");
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return [...users.values()].find((u) => u.id === payload.sub) ?? null;
  } catch {
    return null;
  }
}

function parseFilters(params) {
  const filters = [];
  for (const [key, value] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(key)) continue;
    const m = value.match(/^(eq|neq|in|is)\.(.*)$/s);
    if (m) filters.push({ col: key, op: m[1], val: m[2] });
  }
  return filters;
}

function applyFilters(rows, filters) {
  return rows.filter((r) =>
    filters.every((f) => {
      if (f.op === "eq") return String(r[f.col]) === f.val;
      if (f.op === "neq") return String(r[f.col]) !== f.val;
      if (f.op === "is") return f.val === "null" ? r[f.col] == null : String(r[f.col]) === f.val;
      if (f.op === "in") {
        const list = f.val
          .replace(/^\(|\)$/g, "")
          .split(",")
          .map((s) => s.replace(/^"|"$/g, ""));
        return list.includes(String(r[f.col]));
      }
      return true;
    }),
  );
}

// Embed support. PostgREST embeds are written either as alias:fk_column(cols)
// or alias:table(cols); the admin desk uses both, plus one nested level
// (payout_approvals -> submission -> bounty).
function embedBounty(row) {
  return row?.bounty_id ? (tables.bounties.find((b) => b.id === row.bounty_id) ?? null) : null;
}

function withEmbeds(row, select, table) {
  if (!select) return row;
  const out = { ...row };
  const embedRe = /([a-z_]+):([a-z_]+)\(/g;
  let m;
  while ((m = embedRe.exec(select))) {
    const alias = m[1];
    if (table === "submissions") {
      if (alias === "bounty" || alias === "bounties") out[alias] = embedBounty(row);
      if (alias === "profiles" || alias === "editor")
        out[alias] = tables.profiles.find((p) => p.id === row.editor_id) ?? null;
    }
    if ((table === "payout_approvals" || table === "disputes") && alias === "submission") {
      const sub = tables.submissions.find((x) => x.id === row.submission_id) ?? null;
      out.submission = sub ? { ...sub, bounty: embedBounty(sub) } : null;
    }
  }
  return out;
}

const defaultsByTable = {
  bounties: () => ({
    id: crypto.randomUUID(),
    contract_no: ++contractNo,
    created_at: new Date().toISOString(),
    currency: "USD",
    tiktok_sound_url: null,
    cover_url: null,
    featured_until: null,
    featured_plus: false,
    hashtags: [],
    rules: null,
    counting_days: 14,
    max_clips_per_editor: 15,
    funded_cash_cents: 50000,
    visibility: "public",
    access_mode: null,
  }),
  submissions: () => ({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    view_count: 0,
    verified_view_count: null,
    paid_cash_cents: 0,
    awarded_cash_cents: null,
    counting_ends_at: null,
    tiktok_video_url: null,
    checks: null,
    notes: null,
    flagged: false,
  }),
  profiles: () => ({
    created_at: new Date().toISOString(),
    points: 0,
    display_name: null,
    tiktok_handle: null,
    avatar_url: null,
    wallet_address: null,
    payout_preference: null,
    signup_logged_at: null,
  }),
  tiktok_accounts: () => ({ id: crypto.randomUUID(), created_at: new Date().toISOString() }),
};

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, apikey, content-type, prefer, accept, x-client-info, x-supabase-api-version, content-profile, accept-profile, range, x-tsr-serverfn",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, HEAD, OPTIONS",
  "access-control-expose-headers": "content-range",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, body, extra = {}) =>
    res
      .writeHead(code, { "content-type": "application/json", ...CORS, ...extra })
      .end(body === undefined ? "" : JSON.stringify(body));
  if (req.method === "OPTIONS") return res.writeHead(204, CORS).end();

  // ---- GoTrue ----
  if (url.pathname.startsWith("/auth/v1/")) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const parsed = body ? JSON.parse(body) : {};
      if (url.pathname === "/auth/v1/signup") {
        if (users.has(parsed.email))
          return send(400, {
            code: 400,
            error_code: "user_already_exists",
            msg: "User already registered",
          });
        const user = { id: crypto.randomUUID(), email: parsed.email, password: parsed.password };
        users.set(user.email, user);
        tables.profiles.push({ ...defaultsByTable.profiles(), id: user.id });
        return send(200, makeSession(user));
      }
      if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
        const user = users.get(parsed.email);
        if (!user || user.password !== parsed.password)
          return send(400, {
            code: 400,
            error_code: "invalid_credentials",
            msg: "Invalid login credentials",
          });
        return send(200, makeSession(user));
      }
      if (
        url.pathname === "/auth/v1/token" &&
        url.searchParams.get("grant_type") === "refresh_token"
      ) {
        const user = [...users.values()][0];
        return user ? send(200, makeSession(user)) : send(400, { msg: "no user" });
      }
      if (url.pathname === "/auth/v1/user") {
        const user = userFromAuthHeader(req);
        return user ? send(200, makeSession(user).user) : send(401, { msg: "invalid token" });
      }
      if (url.pathname === "/auth/v1/logout") return send(204);
      if (url.pathname.includes("jwks")) return send(200, { keys: [] });
      return send(404, { msg: `no auth route ${url.pathname}` });
    });
    return;
  }

  // ---- PostgREST ----
  const m = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
  if (!m) return send(404, { message: "not found" });
  const table = m[1];
  tables[table] ??= [];
  const rows = tables[table];
  const filters = parseFilters(url.searchParams);
  const select = url.searchParams.get("select");
  const prefer = req.headers.prefer ?? "";
  const wantsObject = (req.headers.accept ?? "").includes("vnd.pgrst.object");

  const respondRows = (matched, code = 200) => {
    const shaped = matched.map((r) => withEmbeds(r, select, table));
    const headers = {};
    if (prefer.includes("count=")) headers["content-range"] = `*/${matched.length}`;
    if (wantsObject) {
      if (shaped.length === 1) return send(code, shaped[0], headers);
      return send(
        406,
        {
          code: "PGRST116",
          message: `JSON object requested, multiple (or no) rows returned: ${shaped.length}`,
          details: null,
          hint: null,
        },
        headers,
      );
    }
    send(code, shaped, headers);
  };

  if (req.method === "HEAD") {
    const matched = applyFilters(rows, filters);
    const headers = { "content-type": "application/json", ...CORS };
    if (prefer.includes("count=")) headers["content-range"] = `*/${matched.length}`;
    return res.writeHead(200, headers).end();
  }
  if (req.method === "GET") return respondRows(applyFilters(rows, filters));

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const parsed = body ? JSON.parse(body) : {};
    if (req.method === "POST") {
      if (process.env.BLOCK_BOUNTY_INSERT && table === "bounties")
        return send(500, { message: "insert blocked for empty-board test", code: "T3ST" });
      const incoming = Array.isArray(parsed) ? parsed : [parsed];
      const inserted = [];
      for (const rec of incoming) {
        if (prefer.includes("resolution=") && table === "tiktok_accounts") {
          const dup = rows.find((r) => r.user_id === rec.user_id && r.handle === rec.handle);
          if (dup) continue;
        }
        const row = {
          ...(defaultsByTable[table]?.() ?? {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }),
          ...rec,
        };
        rows.push(row);
        inserted.push(row);
      }
      return prefer.includes("return=representation")
        ? respondRows(inserted, 201)
        : send(201, wantsObject ? undefined : []);
    }
    if (req.method === "PATCH") {
      const matched = applyFilters(rows, filters);
      for (const r of matched) Object.assign(r, parsed);
      return prefer.includes("return=representation") ? respondRows(matched) : send(204);
    }
    if (req.method === "DELETE") {
      const matched = applyFilters(rows, filters);
      for (const r of matched) rows.splice(rows.indexOf(r), 1);
      return send(204);
    }
    send(405, { message: "method not supported" });
  });
});

server.listen(54329, "127.0.0.1", () => console.log("backend-mock on 54329"));
