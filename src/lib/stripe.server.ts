// Server-only Stripe helper module. Never import this from client-reachable code.
import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
    _stripe = new Stripe(key, {
      apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

export async function createConnectAccount(userId: string, email: string | null) {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: email ?? undefined,
    metadata: { user_id: userId },
    capabilities: {
      transfers: { requested: true },
    },
  });
  return { accountId: account.id };
}

export async function createConnectOnboardingLink(accountId: string, refreshUrl: string, returnUrl: string) {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return { url: link.url };
}

export async function createCheckoutSession(params: {
  bountyId: string;
  amountCents: number;
  currency: string;
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_intent_data: {
      transfer_group: `bounty_${params.bountyId}`,
      metadata: { bounty_id: params.bountyId },
    },
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.amountCents,
          product_data: { name: "Bounty purse top-up" },
        },
        quantity: 1,
      },
    ],
    ...(params.customerId ? { customer: params.customerId } : {}),
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.bountyId,
  });
  return { sessionId: session.id, url: session.url };
}

export async function createTransfer(params: {
  toAccountId: string;
  amountCents: number;
  currency: string;
  transferGroup: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  const transfer = await stripe.transfers.create({
    destination: params.toAccountId,
    amount: params.amountCents,
    currency: params.currency.toLowerCase(),
    transfer_group: params.transferGroup,
    metadata: params.metadata,
  });
  return { transferId: transfer.id };
}

export async function retrieveAccount(accountId: string) {
  const stripe = getStripe();
  return stripe.accounts.retrieve(accountId);
}
