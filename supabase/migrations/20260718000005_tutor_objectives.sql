-- Scenario objectives progress for the AI tutor conversations.
ALTER TABLE public.tutor_conversations
  ADD COLUMN IF NOT EXISTS objectives_done JSONB NOT NULL DEFAULT '[]'::jsonb;
