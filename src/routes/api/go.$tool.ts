import { createFileRoute } from "@tanstack/react-router";
import { PARTNERS } from "@/lib/partners";

// Outbound tool links route through here so (a) affiliate URLs live in one
// file and (b) every click lands in the event stream — real numbers to show
// when applying to a partner program. Disallowed in robots.txt.
export const Route = createFileRoute("/api/go/$tool")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const partner = PARTNERS[params.tool];
        if (!partner) return new Response("Not found", { status: 404 });

        try {
          const { notifyAsync } = await import("@/lib/notify.server");
          notifyAsync({
            event: "partner.click",
            actor: "visitor",
            reference: params.tool,
            details: {
              referer: request.headers.get("referer") ?? null,
            },
          });
        } catch {
          // logging never blocks the redirect
        }

        return new Response(null, {
          status: 302,
          headers: {
            location: partner.affiliateUrl ?? partner.url,
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
