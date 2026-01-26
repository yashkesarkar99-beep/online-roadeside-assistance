-- Fix the profiles RLS policy logic error
DROP POLICY IF EXISTS "Mechanics can view assigned customer profiles" ON public.profiles;

-- Recreate with correct logic - reference profiles.user_id properly
CREATE POLICY "Mechanics can view assigned customer profiles"
ON public.profiles
FOR SELECT
USING (
  -- Users can always view their own profile
  auth.uid() = user_id
  OR
  -- Mechanics can view profiles of customers whose requests they are assigned to
  (
    is_mechanic(auth.uid()) = true
    AND EXISTS (
      SELECT 1 FROM public.assistance_requests ar
      WHERE ar.assigned_mechanic_id = auth.uid()
      AND ar.user_id = profiles.user_id
    )
  )
);

-- Fix the pending requests policy - mechanics should ONLY access via the masked view
-- Remove direct access to full data for pending requests
DROP POLICY IF EXISTS "Mechanics can view pending requests via preview" ON public.assistance_requests;

-- Mechanics can see full details ONLY for requests assigned to them
-- For pending requests, they must use the view which masks sensitive data
-- The view already has grants restricted to authenticated users