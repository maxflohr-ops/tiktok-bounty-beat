import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getStripe } = await import("@/lib/stripe.server");
        const stripe = getStripe();

        const payload = await request.text();
        const signature = request.headers.get("stripe-signature");
        const sig = process.env.STRIPE_WEBHOOK_SECRET;

        if (!sig) {
          console.warn("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured; skipping event processing.");
          return new Response("ok (webhook secret not configured)", { status: 200 });
        }

        let event;
        try {
          event = stripe.webhooks.constructEvent(payload, signature ?? "", sig);
        } catch (err) {
          console.error("[stripe webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as { id: string; payment_intent: string | null };
          const { data: payment } = await supabaseAdmin
            .from("bounty_payments")
            .select("id,bounty_id,amount_cents")
            .eq("stripe_checkout_session_id", session.id)
            .maybeSingle();

          if (payment) {
            await supabaseAdmin
              .from("bounty_payments")
              .update({
                status: "succeeded",
                stripe_payment_intent_id: session.payment_intent ?? null,
              })
              .eq("id", payment.id);

            const { data: bountyRaw } = await supabaseAdmin
              .from("bounties")
              .select("*")
              .eq("id", payment.bounty_id)
              .maybeSingle();
            const bounty = bountyRaw as unknown as { funded_cash_cents: number | null } | null;
            const currentFunded = bounty?.funded_cash_cents ?? 0;

            await supabaseAdmin
              .from("bounties")
              .update({
                funded_cash_cents: currentFunded + payment.amount_cents,
                top_up_session_id: null,
              })
              .eq("id", payment.bounty_id);
          }
        } else if (event.type === "transfer.created") {
          const transfer = event.data.object as { id: string; amount: number };
          const { data: subRaw } = await supabaseAdmin
            .from("submissions")
            .select("*")
            .eq("stripe_transfer_id", transfer.id)
            .maybeSingle();
          const sub = subRaw as unknown as { id: string; paid_cash_cents: number | null } | null;

          if (sub) {
            await supabaseAdmin
              .from("submissions")
              .update({
                status: "paid",
                paid_at: new Date().toISOString(),
                ...(sub.paid_cash_cents ? {} : { paid_cash_cents: transfer.amount }),
              })
              .eq("id", sub.id);
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
