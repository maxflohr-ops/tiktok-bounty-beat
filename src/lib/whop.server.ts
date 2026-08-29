// Server-only Whop helpers: iframe user-token verification and access checks.
// Never import from client-reachable code at top level — lazy import inside
// createServerFn handlers only (same rule as stripe.server.ts).
//
// Token verification: Whop injects a short-lived JWT in the `x-whop-user-token`
// header on every same-origin request (prod iframe and dev proxy alike). The
// current `@whop/sdk` does not ship a TS verifier (its docs warn as much), so
// verification uses Whop's official `@whop/api` package, which embeds Whop's
// JWT public key and checks signature, expiry, and the app-id audience.

import { makeUserTokenVerifier } from "@whop/api";
import { WhopClient } from "@whop/sdk";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key} environment variable.`);
  return value;
}

type Verifier = ReturnType<typeof makeUserTokenVerifier>;
let _verifier: Verifier | undefined;

/**
 * Verify the proxy/iframe-injected `x-whop-user-token` header.
 * Returns the Whop user id, or null when the token is absent/invalid —
 * callers turn null into a 401, never a redirect to web login.
 */
export async function verifyWhopUserToken(headers: Headers): Promise<{ userId: string } | null> {
  if (!_verifier) {
    _verifier = makeUserTokenVerifier({ appId: requireEnv("WHOP_APP_ID") });
  }
  try {
    const result = await _verifier(headers, { dontThrow: true });
    return result?.userId ? { userId: result.userId } : null;
  } catch {
    return null;
  }
}

let _appClient: WhopClient | undefined;

/** API client authenticated with the App API key (identity/scoping — never money). */
export function getWhopAppClient(): WhopClient {
  if (!_appClient) {
    _appClient = new WhopClient({
      token: requireEnv("WHOP_APP_API_KEY"),
      baseUrl:
        (process.env.WHOP_SANDBOX ?? "true") !== "false"
          ? "https://sandbox-api.whop.com/api/v1"
          : "https://api.whop.com/api/v1",
      apiVersionDate: process.env.WHOP_API_VERSION_DATE || undefined,
    });
  }
  return _appClient;
}

export type WhopAccessLevel = "customer" | "admin" | "no_access";

/** Check a verified user's access to an experience (exp_), account (biz_), or product (prod_). */
export async function checkWhopAccess(
  userId: string,
  resourceId: string,
): Promise<{ hasAccess: boolean; accessLevel: WhopAccessLevel }> {
  const client = getWhopAppClient();
  const res = await client.users.checkAccess({ id: userId, resource_id: resourceId });
  return {
    hasAccess: Boolean(res.has_access),
    accessLevel: (res.access_level ?? "no_access") as WhopAccessLevel,
  };
}
