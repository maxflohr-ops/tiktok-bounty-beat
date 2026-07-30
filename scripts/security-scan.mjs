#!/usr/bin/env node
/**
 * Security scan for CI.
 *
 * Produces a deterministic list of findings and compares them against
 * .security/baseline.json. The build fails only on NEW findings, so existing
 * accepted risks don't block every PR.
 *
 * Update the baseline intentionally with:  bun run security:scan -- --update-baseline
 */
import { execFile } from "node:child_process";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, ".security", "baseline.json");
const UPDATE_BASELINE = process.argv.includes("--update-baseline");

/** @type {{id:string,severity:'critical'|'high'|'medium',title:string,detail:string}[]} */
const findings = [];
const add = (f) => findings.push(f);

// ---------------------------------------------------------------- helpers
async function walk(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (["node_modules", ".git", "dist", ".output", ".nitro", ".vinxi"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

// ---------------------------------------------------------- 1. dependencies
async function scanDependencies() {
  const runners = [
    ["bun", ["audit", "--json"]],
    ["npm", ["audit", "--json"]],
  ];
  for (const [cmd, args] of runners) {
    try {
      const { stdout } = await execFileAsync(cmd, args, {
        cwd: ROOT,
        maxBuffer: 32 * 1024 * 1024,
      }).catch((err) => ({ stdout: err.stdout ?? "" }));
      if (!stdout.trim()) continue;
      const json = JSON.parse(stdout.slice(stdout.indexOf("{")));
      const vulns = json.vulnerabilities ?? {};
      let reported = false;
      for (const [name, v] of Object.entries(vulns)) {
        const severity = Array.isArray(v) ? "high" : v.severity;
        if (!["high", "critical"].includes(severity)) continue;
        reported = true;
        add({
          id: `dep:${name}:${severity}`,
          severity,
          title: `Vulnerable dependency: ${name}`,
          detail: `${severity} severity advisory reported by ${cmd} audit`,
        });
      }
      return reported || true; // audit ran successfully
    } catch {
      /* try next runner */
    }
  }
  console.warn("⚠️  dependency audit unavailable (offline registry) — skipped");
  return false;
}

// -------------------------------------------------- 2. secrets in client code
const SECRET_PATTERNS = [
  [/\bsb_secret_[A-Za-z0-9_-]{10,}/g, "Supabase secret key literal"],
  [/\bsk_(live|test)_[A-Za-z0-9]{10,}/g, "Stripe secret key literal"],
  [/\bSUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'][^"']+["']/g, "Hardcoded service role key"],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g, "Private key material"],
];

async function scanSecrets(files) {
  for (const file of files) {
    if (!/\.(ts|tsx|js|jsx|mjs|json|sql|md|yml|yaml)$/.test(file)) continue;
    if (rel(file).startsWith("scripts/security-scan")) continue;
    const src = await readFile(file, "utf8");
    for (const [re, title] of SECRET_PATTERNS) {
      if (re.test(src)) {
        add({
          id: `secret:${title}:${rel(file)}`,
          severity: "critical",
          title,
          detail: `Potential secret committed in ${rel(file)}`,
        });
      }
      re.lastIndex = 0;
    }
  }
}

// ------------------------------------ 3. server-only imports in client bundles
async function scanServerLeaks(files) {
  for (const file of files) {
    if (!/^src\/(routes|components|hooks)\//.test(rel(file))) continue;
    if (!/\.(ts|tsx)$/.test(file) || /\.server\.tsx?$/.test(file)) continue;
    const src = await readFile(file, "utf8");
    const staticImports = [...src.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']/gm)].map(
      (m) => m[1],
    );
    for (const spec of staticImports) {
      if (/\.server(\.|$)|@\/server\/|client\.server/.test(spec)) {
        add({
          id: `leak:${rel(file)}:${spec}`,
          severity: "high",
          title: "Server-only module imported from client code",
          detail: `${rel(file)} statically imports ${spec}`,
        });
      }
    }
    if (/supabaseAdmin/.test(src) && !/await import\(/.test(src)) {
      add({
        id: `leak:admin-client:${rel(file)}`,
        severity: "critical",
        title: "Admin (service-role) Supabase client reachable from client code",
        detail: `${rel(file)} references supabaseAdmin without a dynamic server-side import`,
      });
    }
  }
}

// ------------------------------------------------ 4. RLS / GRANT in migrations
async function scanMigrations() {
  const dir = path.join(ROOT, "supabase", "migrations");
  if (!existsSync(dir)) return;
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const all = [];
  for (const f of files) all.push(await readFile(path.join(dir, f), "utf8"));
  const sql = all.join("\n").toLowerCase();

  const created = new Set(
    [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]+)/g)].map(
      (m) => m[1],
    ),
  );
  for (const table of created) {
    if (!new RegExp(`alter\\s+table\\s+(only\\s+)?public\\.${table}\\s+enable\\s+row\\s+level\\s+security`).test(sql)) {
      add({
        id: `rls:missing-enable:${table}`,
        severity: "critical",
        title: `RLS not enabled on public.${table}`,
        detail: "Table is created in a migration but never has RLS enabled",
      });
    }
    if (!new RegExp(`grant[^;]+on[^;]*public\\.${table}\\b`).test(sql)) {
      add({
        id: `rls:missing-grant:${table}`,
        severity: "high",
        title: `No GRANT statement for public.${table}`,
        detail: "PostgREST needs explicit grants; table may be unreachable or misconfigured",
      });
    }
  }
}

// ------------------------------------------------------------------- runner
const files = await walk(ROOT);
await scanDependencies();
await scanSecrets(files);
await scanServerLeaks(files);
await scanMigrations();

findings.sort((a, b) => a.id.localeCompare(b.id));

let baseline = { ignored: [] };
if (existsSync(BASELINE_PATH)) {
  baseline = JSON.parse(await readFile(BASELINE_PATH, "utf8"));
}
const ignored = new Set(baseline.ignored?.map((f) => (typeof f === "string" ? f : f.id)) ?? []);

if (UPDATE_BASELINE) {
  await mkdir(path.dirname(BASELINE_PATH), { recursive: true });
  await writeFile(
    BASELINE_PATH,
    JSON.stringify(
      {
        $comment:
          "Accepted security findings. Entries here do not fail CI. Remove an entry once the underlying issue is fixed.",
        ignored: findings.map(({ id, severity, title }) => ({ id, severity, title })),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Baseline updated with ${findings.length} finding(s) → ${rel(BASELINE_PATH)}`);
  process.exit(0);
}

const newFindings = findings.filter((f) => !ignored.has(f.id));

console.log(`Security scan: ${findings.length} finding(s), ${ignored.size} baselined.`);
for (const f of findings) {
  const mark = ignored.has(f.id) ? "baselined" : "NEW";
  console.log(`  [${f.severity.toUpperCase()}][${mark}] ${f.title} — ${f.detail}`);
}

if (newFindings.length > 0) {
  console.error(`\n❌ ${newFindings.length} new security finding(s). Failing the build.`);
  console.error(
    "   Fix them, or if intentionally accepted run: bun run security:scan -- --update-baseline",
  );
  process.exit(1);
}

console.log("\n✅ No new security findings.");
