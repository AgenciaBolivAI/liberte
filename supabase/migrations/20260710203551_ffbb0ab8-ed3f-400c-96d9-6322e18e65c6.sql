
-- Wipe all test data
DELETE FROM public.weekly_evaluations;
DELETE FROM public.activity_results;
DELETE FROM public.defi_results;
DELETE FROM public.week_unlocks;
DELETE FROM public.user_roles;
DELETE FROM public.email_send_log;
DELETE FROM public.email_unsubscribe_tokens;
DELETE FROM public.suppressed_emails;
DELETE FROM public.leads;
DELETE FROM public.profiles;
DELETE FROM auth.users;
