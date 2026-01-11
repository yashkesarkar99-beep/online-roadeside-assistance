-- Drop the recursive policy
DROP POLICY IF EXISTS "Mechanics can view all profiles" ON public.profiles;

-- Create a security definer function to check if user is mechanic (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_mechanic(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_mechanic FROM public.profiles WHERE user_id = user_uuid),
    false
  );
$$;

-- Create a non-recursive policy using the function
CREATE POLICY "Mechanics can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND public.is_mechanic(auth.uid()) = true
);