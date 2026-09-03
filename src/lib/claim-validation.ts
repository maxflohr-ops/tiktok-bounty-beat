import { z } from "zod";

// TikTok handles: 2-24 chars, letters/digits/underscore/period, no leading/trailing period.
export const tiktokHandleSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@+/, "").toLowerCase())
  .pipe(
    z
      .string()
      .min(2, "TikTok handle must be at least 2 characters.")
      .max(24, "TikTok handle must be 24 characters or fewer.")
      .regex(
        /^[a-z0-9_](?:[a-z0-9_.]{0,22}[a-z0-9_])?$/,
        "TikTok handle can only contain letters, numbers, underscores, and periods.",
      ),
  );

export const paypalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid PayPal email address.")
  .max(160, "PayPal email must be 160 characters or fewer.");

export const claimContractSchema = z.object({
  bounty_id: z.string().uuid(),
  tiktok_handle: tiktokHandleSchema,
  // Optional: an editor with a connected wallet can claim without PayPal.
  paypal_email: paypalEmailSchema.optional().or(z.literal("").transform(() => undefined)),
  // Clip slots reserved on this contract (site max 15 for now).
  clips: z.number().int().min(1).max(15).default(1),
});

export type ClaimContractInput = z.infer<typeof claimContractSchema>;

export type ClaimFieldErrors = { tiktok_handle?: string; paypal_email?: string };

export function validateClaimFields(input: {
  tiktok_handle: string;
  paypal_email: string;
  paypalOptional?: boolean;
}) {
  const result = z
    .object({
      tiktok_handle: tiktokHandleSchema,
      paypal_email: input.paypalOptional
        ? paypalEmailSchema.optional().or(z.literal("").transform(() => undefined))
        : paypalEmailSchema,
    })
    .safeParse(input);
  if (result.success)
    return { ok: true as const, data: result.data, errors: {} as ClaimFieldErrors };
  const errors: ClaimFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ClaimFieldErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  const first = result.error.issues[0];
  return { ok: false as const, errors, message: first?.message ?? "Invalid input." };
}

export function validateTiktokHandle(value: string): string | undefined {
  const r = tiktokHandleSchema.safeParse(value);
  return r.success ? undefined : r.error.issues[0]?.message;
}

export function validatePaypalEmail(value: string): string | undefined {
  const r = paypalEmailSchema.safeParse(value);
  return r.success ? undefined : r.error.issues[0]?.message;
}
