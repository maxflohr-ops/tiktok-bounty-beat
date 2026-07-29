ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_address text
    CHECK (wallet_address IS NULL OR wallet_address ~ '^0x[0-9a-fA-F]{40}$');

COMMENT ON COLUMN public.profiles.wallet_address IS
  'EVM address for USDC payouts. Self-declared by the user via wallet connect or manual entry.';