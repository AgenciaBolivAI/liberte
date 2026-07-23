-- Enable peer-to-peer messaging (student <-> student), not only teacher <-> student.
--
-- The original "send own messages" policy REQUIRED the conversation to involve a
-- coach/admin. The client now wants students to message each other too, so we
-- drop that requirement. Safety is preserved by:
--   * you may still only send AS yourself (auth.uid() = sender_id);
--   * the messages_not_self CHECK + recipient FK still hold (real users only);
--   * only APPROVED accounts can send (enforced in the sendMessage server fn),
--     and the contact directory (getContacts) only lists approved users, so an
--     unapproved signup can neither discover nor DM the cohort.

DROP POLICY IF EXISTS "send own messages" ON public.messages;
CREATE POLICY "send own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
