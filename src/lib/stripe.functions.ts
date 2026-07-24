import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function appOrigin() {
  return process.env.NODE_ENV === "production"
    ? "https://www.bountysounds.com"
    : "http://localhost:8080";
}

// GET the current user's payout method row (or null).
export const getMyPayoutMethod = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payout_methods")
      .select("user_id,default_method,stripe_connect_account_id,stripe_connect_status,paypal_email")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  });

// Start (or resume) Stripe Express onboarding for the current user.
export const connectStripeAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { createConnectAccount, createConnectOnboardingLink } = await import("@/lib/stripe.server");

    const { data: existing } = await context.supabase
      .from("payout_methods")
      .select("stripe_connect_account_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    let accountId = existing?.stripe_connect_account_id ?? null;

    if (!accountId) {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("id")
        .eq("id", context.userId)
        .maybeSingle();
      const email = (context.claims as { email?: string } | undefined)?.email ?? null;
      const { accountId: newAccountId } = await createConnectAccount(context.userId, email);
      accountId = newAccountId;
      void profile;
    }

    const { error: upsertError } = await context.supabase
      .from("payout_methods")
      .upsert(
        {
          user_id: context.userId,
          default_method: "stripe",
          stripe_connect_account_id: accountId,
          stripe_connect_status: "pending",
        },
        { onConflict: "user_id" },
      );
    if (upsertError) throw new Error(upsertError.message);

    const origin = appOrigin();
    const { url } = await createConnectOnboardingLink(
      accountId!,
      `${origin}/dashboard?stripe_connect_refresh=1`,
      `${origin}/dashboard?stripe_connect_return=1`,
    );
    return { url };
  });

// Refresh the connect status for the current user's Stripe account.
export const refreshConnectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: pm, error } = await context.supabase
      .from("payout_methods")
      .select("user_id,default_method,stripe_connect_account_id,stripe_connect_status,paypal_email")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!pm || !pm.stripe_connect_account_id) return pm ?? null;

    const { retrieveAccount } = await import("@/lib/stripe.server");
    const account = await retrieveAccount(pm.stripe_connect_account_id);
    const status = account.charges_enabled && account.payouts_enabled
      ? "enabled"
      : account.details_submitted
        ? "pending"
        : "disabled";

    const { data: updated, error: ue } = await context.supabase
      .from("payout_methods")
      .update({ stripe_connect_status: status })
      .eq("user_id", context.userId)
      .select("user_id,default_method,stripe_connect_account_id,stripe_connect_status,paypal_email")
      .single();
    if (ue) throw new Error(ue.message);
    return updated;
  });

// Staff: create a Stripe Checkout session to top up a bounty's cash pot.
export const createBountyTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bountyId: z.string().uuid(),
        amountCents: z.number().int().positive(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden");

    const { data: bounty, error: be } = await context.supabase
      .from("bounties")
      .select("id,currency")
      .eq("id", data.bountyId)
      .single();
    if (be || !bounty) throw new Error("Bounty not found.");

    const { data: bountyExtraRaw } = await context.supabase
      .from("bounties")
      .select("*")
      .eq("id", data.bountyId)
      .single();
    const bountyExtra = bountyExtraRaw as unknown as { stripe_customer_id: string | null } | null;

    const { getStripe, createCheckoutSession } = await import("@/lib/stripe.server");

    let customerId = bountyExtra?.stripe_customer_id ?? null;
    if (!customerId) {
      const stripe = getStripe();
      const customer = await stripe.customers.create({ metadata: { bounty_id: data.bountyId } });
      customerId = customer.id;
      await context.supabase
        .from("bounties")
        // @ts-expect-error stripe_customer_id is not in generated types yet
        .update({ stripe_customer_id: customerId })
        .eq("id", data.bountyId);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error: pe } = await supabaseAdmin
      .from("bounty_payments")
      .insert({
        bounty_id: data.bountyId,
        amount_cents: data.amountCents,
        currency: bounty.currency,
        status: "pending",
      })
      .select("id")
      .single();
    if (pe || !payment) throw new Error(pe?.message ?? "Could not create payment record.");

    const origin = appOrigin();
    const { sessionId, url } = await createCheckoutSession({
      bountyId: data.bountyId,
      amountCents: data.amountCents,
      currency: bounty.currency,
      customerId,
      successUrl: `${origin}/admin?topup_success=1`,
      cancelUrl: `${origin}/admin?topup_cancelled=1`,
    });

    await supabaseAdmin
      .from("bounty_payments")
      .update({ stripe_checkout_session_id: sessionId })
      .eq("id", payment.id);

    await context.supabase
      .from("bounties")
      // @ts-expect-error top_up_session_id is not in generated types yet
      .update({ top_up_session_id: sessionId })
      .eq("id", data.bountyId);

    return { url, sessionId };
  });

// Staff: pay out an approved submission via Stripe Connect transfer.
export const payoutEditor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ submissionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden");

    const { data: sub, error: se } = await context.supabase
      .from("submissions")
      .select(
        "id,editor_id,status,awarded_cash_cents,view_count,paid_cash_cents,stripe_transfer_id,bounty_id,bounties:bounty_id(id,currency,payout_type,reward_cash_cents,funded_cash_cents)",
      )
      .eq("id", data.submissionId)
      .single();
    if (se || !sub) throw new Error("Claim not found.");
    if (sub.status !== "approved") throw new Error("Claim must be honored before paying.");
    const paidAlready = (sub as unknown as { paid_cash_cents: number | null }).paid_cash_cents ?? 0;
    if (paidAlready > 0 || sub.stripe_transfer_id) throw new Error("Already paid.");

    const bounty = (sub as unknown as {
      bounties: { id: string; currency: string; payout_type: string; reward_cash_cents: number; funded_cash_cents: number | null };
    }).bounties;
    if (!bounty) throw new Error("Bounty not found.");

    let amountCents = 0;
    if (bounty.payout_type === "per_1k_views") {
      amountCents = Math.floor((sub.view_count || 0) / 1000) * bounty.reward_cash_cents;
    } else {
      amountCents = sub.awarded_cash_cents ?? bounty.reward_cash_cents;
    }
    if (amountCents <= 0) throw new Error("Nothing to pay.");

    const funded = bounty.funded_cash_cents ?? 0;
    if (funded < amountCents) throw new Error("Insufficient funds in the bounty pot.");

    const { data: pm, error: pme } = await context.supabase
      .from("payout_methods")
      .select("stripe_connect_account_id,stripe_connect_status,default_method")
      .eq("user_id", sub.editor_id)
      .eq("default_method", "stripe")
      .maybeSingle();
    if (pme) throw new Error(pme.message);
    if (!pm || !pm.stripe_connect_account_id || pm.stripe_connect_status !== "enabled")
      throw new Error("Editor has not connected a Stripe payout account.");

    const { createTransfer } = await import("@/lib/stripe.server");
    const { transferId } = await createTransfer({
      toAccountId: pm.stripe_connect_account_id,
      amountCents,
      currency: bounty.currency,
      transferGroup: `bounty_${bounty.id}`,
      metadata: {
        submission_id: sub.id,
        bounty_id: bounty.id,
        editor_id: sub.editor_id,
      },
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: ue } = await supabaseAdmin
      .from("submissions")
      .update({
        stripe_transfer_id: transferId,
        paid_cash_cents: amountCents,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
    if (ue) throw new Error(ue.message);

    await supabaseAdmin
      .from("bounties")
      // @ts-expect-error funded_cash_cents is not in generated types yet
      .update({ funded_cash_cents: funded - amountCents })
      .eq("id", bounty.id);

    return { transferId, amountCents };
  });

// Alias kept for admin UI naming: Stripe Connect payout for a submission.
export const stripePayout = payoutEditor;
