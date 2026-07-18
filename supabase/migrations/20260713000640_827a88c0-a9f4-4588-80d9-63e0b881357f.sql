
-- Grant admin role to the teacher
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'libertedirec@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all star awards
DROP POLICY IF EXISTS "Admins can view all star awards" ON public.star_awards;
CREATE POLICY "Admins can view all star awards" ON public.star_awards
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all day completions
DROP POLICY IF EXISTS "Admins can view all day completions" ON public.day_completions;
CREATE POLICY "Admins can view all day completions" ON public.day_completions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
