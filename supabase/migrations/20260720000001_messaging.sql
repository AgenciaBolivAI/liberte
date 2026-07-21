-- Teacher <-> student direct messaging, with optional document attachments.
--
-- Rules:
--   * Every conversation must involve a staff member (coach/admin) — students
--     cannot DM each other; this is a teacher<->student channel.
--   * You read only threads you are part of; you send only as yourself; the
--     recipient can mark a message read.
--   * Attachments live in a PRIVATE storage bucket; downloads are brokered by a
--     server fn that signs a URL only for a participant (see messaging.functions).

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  attachment_path TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  CONSTRAINT messages_not_self CHECK (sender_id <> recipient_id),
  CONSTRAINT messages_body_len CHECK (char_length(body) <= 5000),
  CONSTRAINT messages_has_content CHECK (body <> '' OR attachment_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS messages_participants_idx ON public.messages (sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages (recipient_id, created_at DESC);

-- Recipients may only flip read_at, never edit body/sender (column-scoped UPDATE).
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own messages" ON public.messages;
CREATE POLICY "read own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Send as yourself, and the conversation must involve a staff member.
DROP POLICY IF EXISTS "send own messages" ON public.messages;
CREATE POLICY "send own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      public.has_role(sender_id, 'coach') OR public.has_role(sender_id, 'admin')
      OR public.has_role(recipient_id, 'coach') OR public.has_role(recipient_id, 'admin')
    )
  );

-- Only the recipient can flip read_at (mark as read).
DROP POLICY IF EXISTS "recipient marks read" ON public.messages;
CREATE POLICY "recipient marks read"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Private bucket for attachments.
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Upload only under your own {uid}/ folder. Downloads go through a signed URL
-- minted by the server fn for participants, so no public SELECT policy exists.
DROP POLICY IF EXISTS "upload own attachments" ON storage.objects;
CREATE POLICY "upload own attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
