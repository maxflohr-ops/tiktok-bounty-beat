// Whop auth middleware, in its own module the same way requireSupabaseAuth
// lives in auth-middleware.ts — server-fn files must export only server fns
// for the start compiler's function splitting.

import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// Verifies the proxy/iframe-injected x-whop-user-token on the incoming request.
// No token or a bad token is a hard 401 — never a redirect to the web login.
export const requireWhopAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  if (!request?.headers) {
    throw new Response("Unauthorized: no request headers", { status: 401 });
  }
  const { verifyWhopUserToken } = await import("@/lib/whop.server");
  const verified = await verifyWhopUserToken(request.headers);
  if (!verified) {
    throw new Response("Unauthorized: missing or invalid Whop user token", { status: 401 });
  }
  return next({ context: { whopUserId: verified.userId } });
});
