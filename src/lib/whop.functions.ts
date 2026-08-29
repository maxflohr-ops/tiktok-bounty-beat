// Whop shell server functions. This file ships to the client bundle, so no
// secrets or Whop clients at top level — everything privileged is lazy-imported
// from whop.server.ts inside handlers (same pattern as stripe.functions.ts).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireWhopAuth } from "@/lib/whop-auth-middleware";

// The WO-1 acceptance probe: token in → verified server-side → user id out.
// The token itself and all API keys stay on the server.
export const whopWhoami = createServerFn({ method: "GET" })
  .middleware([requireWhopAuth])
  .handler(async ({ context }) => {
    return { whopUserId: context.whopUserId };
  });

// Experience-view context: verify the user, then check their access level on
// the experience they are viewing. no_access renders a denial, not a redirect.
export const whopExperienceContext = createServerFn({ method: "GET" })
  .middleware([requireWhopAuth])
  .inputValidator((d: unknown) => z.object({ experienceId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { checkWhopAccess } = await import("@/lib/whop.server");
    const access = await checkWhopAccess(context.whopUserId, data.experienceId);
    return {
      whopUserId: context.whopUserId,
      experienceId: data.experienceId,
      hasAccess: access.hasAccess,
      accessLevel: access.accessLevel,
    };
  });

// Dashboard-view context (funder side): requires admin on the company.
export const whopDashboardContext = createServerFn({ method: "GET" })
  .middleware([requireWhopAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { checkWhopAccess } = await import("@/lib/whop.server");
    const access = await checkWhopAccess(context.whopUserId, data.companyId);
    return {
      whopUserId: context.whopUserId,
      companyId: data.companyId,
      hasAccess: access.hasAccess,
      accessLevel: access.accessLevel,
    };
  });
