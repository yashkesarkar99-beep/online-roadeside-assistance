-- The issue is that "Mechanics can browse pending requests" policy on assistance_requests
-- allows mechanics to directly query the table with full data, bypassing the view masking
-- 
-- Solution: Remove the direct table policy and ensure mechanics ONLY access via the edge function
-- which queries the service role and returns masked view data

-- Drop the policy that exposes full data to mechanics
DROP POLICY IF EXISTS "Mechanics can browse pending requests" ON public.assistance_requests;

-- Now mechanics can ONLY see:
-- 1. Full details for requests ASSIGNED to them (via "Mechanics can view their assigned requests")
-- 2. Masked preview data through the edge function (which uses service role)

-- The pending_requests_preview view is a VIEW (not a table with RLS)
-- It's accessed via edge function with service role which:
-- 1. Verifies the user is authenticated
-- 2. Verifies the user is a mechanic
-- 3. Returns only the masked data from the view
-- This is secure by design