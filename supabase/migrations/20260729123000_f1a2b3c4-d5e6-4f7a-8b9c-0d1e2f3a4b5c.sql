-- Track whether a user's signup has been logged to the event stream
-- (Airtable/Sheets/email). Backfill existing users so only genuinely new
-- accounts fire a user.signup event.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_logged_at timestamptz;

UPDATE public.profiles
SET signup_logged_at = created_at
WHERE signup_logged_at IS NULL;
