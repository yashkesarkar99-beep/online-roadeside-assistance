-- Fix the security definer view issue by using security_invoker instead
-- Drop existing view
DROP VIEW IF EXISTS public.pending_requests_preview;

-- Recreate view with security_invoker = true (uses the querying user's permissions)
CREATE VIEW public.pending_requests_preview 
WITH (security_invoker = true) AS
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

-- Add RLS policy on assistance_requests to allow mechanics to view pending requests (masked via view)
CREATE POLICY "Mechanics can view pending requests via preview"
ON public.assistance_requests
FOR SELECT
USING (
  -- Allow mechanics to see pending requests (they access via the view which masks sensitive data)
  status = 'pending' AND is_mechanic(auth.uid())
);