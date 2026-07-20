-- The avatars bucket was created by hand in the dashboard, so a database
-- rebuilt purely from migrations had no place to store profile photos and
-- avatar upload/display failed silently. Create it as part of the schema.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Students manage only their own folder: <user_id>/<file>
DROP POLICY IF EXISTS "own_avatar_read" ON storage.objects;
CREATE POLICY "own_avatar_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_avatar_insert" ON storage.objects;
CREATE POLICY "own_avatar_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_avatar_update" ON storage.objects;
CREATE POLICY "own_avatar_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "own_avatar_delete" ON storage.objects;
CREATE POLICY "own_avatar_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Coaches and admins can view any student's avatar in the teacher panel.
DROP POLICY IF EXISTS "staff_avatar_read" ON storage.objects;
CREATE POLICY "staff_avatar_read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  );
