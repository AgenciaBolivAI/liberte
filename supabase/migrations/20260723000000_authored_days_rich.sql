-- Weeks 3+ become teacher-editable in the SAME design as weeks 1-2. Instead of
-- the generic block list (authored_blocks → AuthoredDayView), a day can now carry
-- a full "rich" lesson (a RichDay: 30 vocab, flashcards, 4 grammar structures,
-- the 4 vocab games + 4 clés games, the staged défi, plus UI meta) in one jsonb
-- column. The lesson player renders `rich` through the exact weeks-1-2 shell, so
-- authored days look identical to the code-built days 1-10.
--
-- The column is nullable so existing block-based authored days keep working; a
-- day uses `rich` when present, else its blocks, else the WEEK34 code seed.

ALTER TABLE public.authored_days
  ADD COLUMN IF NOT EXISTS rich JSONB;

COMMENT ON COLUMN public.authored_days.rich IS
  'Full RichDay lesson (WeekDay content + UI meta) rendered through the weeks-1-2 shell. Null = fall back to authored_blocks or the WEEK34 code seed.';
