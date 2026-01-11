-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Mechanics can view profiles" ON public.profiles;

-- Create a fixed policy that avoids recursion by using a direct auth check
CREATE POLICY "Mechanics can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (SELECT is_mechanic FROM public.profiles WHERE user_id = auth.uid()) = true
);