-- Telegram account linking + reminders. A student links their Telegram from
-- their profile and then receives reminders for upcoming live classes and other
-- notifications. The bot token lives ONLY in a server env var (never in code):
--   TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, CRON_SECRET.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_link_code TEXT,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

-- The webhook finds the account to link by its one-time code; keep it unique.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_telegram_link_code_idx
  ON public.profiles (telegram_link_code) WHERE telegram_link_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_telegram_chat_idx
  ON public.profiles (telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- The telegram_* columns are written ONLY by the service role (the link server
-- fn and the webhook). They are deliberately NOT part of the authenticated
-- column-level UPDATE grant on profiles, so a student can read their own values
-- (own-row SELECT) but cannot set telegram_chat_id directly from the browser.

-- One reminder per (event, student) so a class isn't announced twice.
CREATE TABLE IF NOT EXISTS public.telegram_reminders (
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

GRANT ALL ON public.telegram_reminders TO service_role;
ALTER TABLE public.telegram_reminders ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (reminder job) ever touches this table.
