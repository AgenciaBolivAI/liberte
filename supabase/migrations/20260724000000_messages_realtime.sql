-- Enable Supabase Realtime (postgres changes) for the messaging table so
-- message threads and the /mensajes inbox update live without a reload.
-- Realtime respects RLS: subscribers only receive rows their own session can
-- SELECT (the "read own messages" policy), so no policy changes are needed.
-- Idempotent: adding an already-published table raises an error, so check first.

DO $$
BEGIN
  -- Only touch the publication if it exists (it always does on hosted Supabase;
  -- a self-hosted rebuild may not have it, and ALTER would otherwise error).
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;
