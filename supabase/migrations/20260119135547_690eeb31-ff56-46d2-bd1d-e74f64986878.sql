-- Create a view for pending request previews with masked contact information
-- This protects customer privacy by showing only redacted info until mechanic accepts

CREATE OR REPLACE VIEW public.pending_requests_preview
WITH (security_invoker = on) AS
SELECT 
  id,
  service_type,
  status,
  created_at,
  updated_at,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_color,
  -- Mask contact name: "John Doe" -> "J. D."
  CASE 
    WHEN contact_name IS NOT NULL AND LENGTH(contact_name) > 0 THEN
      LEFT(contact_name, 1) || '.' || 
      COALESCE(
        CASE 
          WHEN POSITION(' ' IN contact_name) > 0 
          THEN ' ' || LEFT(SUBSTRING(contact_name FROM POSITION(' ' IN contact_name) + 1), 1) || '.'
          ELSE ''
        END,
        ''
      )
    ELSE 'Customer'
  END as contact_name_masked,
  -- Completely hide phone number
  'Available after acceptance' as contact_phone_masked,
  -- Show only general area (first part of address before comma)
  CASE 
    WHEN location_address IS NOT NULL AND POSITION(',' IN location_address) > 0 
    THEN SPLIT_PART(location_address, ',', 1) || ' area'
    ELSE 'Location available after acceptance'
  END as location_area,
  -- Keep coordinates for distance calculation (rounded for privacy)
  ROUND(location_lat::numeric, 2) as location_lat_approx,
  ROUND(location_lng::numeric, 2) as location_lng_approx,
  -- Hide issue description for pending
  NULL::text as issue_description
FROM public.assistance_requests
WHERE status = 'pending';

-- Grant SELECT on the view to authenticated users (will still respect RLS)
GRANT SELECT ON public.pending_requests_preview TO authenticated;

-- Drop the old policy that exposes full data to all mechanics for pending requests
DROP POLICY IF EXISTS "Mechanics can view pending requests" ON public.assistance_requests;

-- Create new policy: Mechanics can only view ASSIGNED requests (not all pending)
CREATE POLICY "Mechanics can view assigned requests"
ON public.assistance_requests
FOR SELECT
TO authenticated
USING (
  (assigned_mechanic_id = auth.uid())
  AND public.is_mechanic(auth.uid())
);

-- Keep the existing policy for users viewing their own requests
-- (already exists: "Users can view their own requests")