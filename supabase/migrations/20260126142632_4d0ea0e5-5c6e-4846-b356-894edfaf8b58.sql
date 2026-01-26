-- Fix 1: Enable RLS on pending_requests_preview view
-- Note: Views inherit RLS from underlying tables, but we should ensure access is controlled
-- We'll create a security barrier view instead

-- Drop existing view
DROP VIEW IF EXISTS public.pending_requests_preview;

-- Recreate as security barrier view with RLS context
CREATE VIEW public.pending_requests_preview WITH (security_barrier = true) AS
SELECT
  id,
  service_type,
  status,
  created_at,
  updated_at,
  -- Approximate coordinates (rounded to ~1km)
  ROUND(location_lat::numeric, 2) AS location_lat_approx,
  ROUND(location_lng::numeric, 2) AS location_lng_approx,
  -- Extract city/area from address (first part before comma)
  SPLIT_PART(location_address, ',', 1) AS location_area,
  -- Truncated issue description
  LEFT(issue_description, 100) AS issue_description,
  -- Vehicle info (not sensitive)
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_color,
  -- Masked contact info
  LEFT(contact_name, 1) || '***' AS contact_name_masked,
  '***-***-' || RIGHT(contact_phone, 4) AS contact_phone_masked
FROM public.assistance_requests
WHERE status = 'pending';

-- Grant access only to authenticated users
REVOKE ALL ON public.pending_requests_preview FROM anon;
REVOKE ALL ON public.pending_requests_preview FROM public;
GRANT SELECT ON public.pending_requests_preview TO authenticated;

-- Fix 2: Update profiles RLS policy to restrict mechanic access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Mechanics can view all profiles" ON public.profiles;

-- Create more restrictive policy: mechanics can only view profiles of customers they're serving
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
      AND ar.user_id = user_id
    )
  )
);

-- Fix 3: Update assistance_requests SELECT policy for mechanics
-- Drop the existing mechanic view policy
DROP POLICY IF EXISTS "Mechanics can view assigned requests" ON public.assistance_requests;

-- Create policy that only allows mechanics to view THEIR assigned requests (full details)
CREATE POLICY "Mechanics can view their assigned requests"
ON public.assistance_requests
FOR SELECT
USING (
  -- Mechanics can only see full details of requests assigned to them
  assigned_mechanic_id = auth.uid() AND is_mechanic(auth.uid())
);

-- Create separate policy for mechanics to see pending requests via the preview view
-- The actual data access goes through the security barrier view