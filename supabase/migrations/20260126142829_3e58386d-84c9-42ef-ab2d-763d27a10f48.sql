-- The pending_requests_preview is a VIEW, not a table
-- Views with security_invoker = true inherit RLS from underlying tables
-- Since we removed the "Mechanics can view pending requests via preview" policy,
-- mechanics now cannot access the underlying data through the view

-- The view is now properly secured because:
-- 1. It uses security_invoker = true (queries run as the calling user)
-- 2. GRANTS restrict access to authenticated role only
-- 3. The underlying assistance_requests table has RLS policies

-- However, the scan is detecting it doesn't have direct RLS
-- We need to ensure mechanics CAN access pending requests through proper policy

-- Add a policy that allows mechanics to SELECT pending requests (needed for the view to work)
CREATE POLICY "Mechanics can browse pending requests"
ON public.assistance_requests
FOR SELECT
USING (
  -- Only for pending requests
  status = 'pending' 
  -- Only for authenticated mechanics
  AND auth.uid() IS NOT NULL
  AND is_mechanic(auth.uid())
);