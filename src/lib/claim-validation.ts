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
  paypal_email: paypalEmailSchema,
});

export type ClaimContractInput = z.infer<typeof claimContractSchema>;

export function validateClaimFields(input: { tiktok_handle: string; paypal_email: string }) {
  const result = z
    .object({ tiktok_handle: tiktokHandleSchema, paypal_email: paypalEmailSchema })
    .safeParse(input);
  if (result.success) return { ok: true as const, data: result.data };
  const first = result.error.issues[0];
  return { ok: false as const, message: first?.message ?? "Invalid input." };
}
