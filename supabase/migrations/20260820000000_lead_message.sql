-- The owner receives a lead and cannot tell what the person actually wants.
-- Nothing in the form, the table or the notification ever asked.
alter table public.leads add column if not exists message text;

comment on column public.leads.message is
  'What the prospect wrote about what they need help with. Optional: the field
   is optional on the landing form so it cannot hurt conversion.';
