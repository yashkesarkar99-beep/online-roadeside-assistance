-- Fix PUBLIC_DATA_EXPOSURE: Remove the OR user_id IS NULL condition and implement tracking tokens

-- 1. Add a tracking_token column for anonymous request tracking
ALTER TABLE public.assistance_requests 
ADD COLUMN IF NOT EXISTS tracking_token uuid DEFAULT gen_random_uuid();

-- 2. Create an index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_assistance_requests_tracking_token 
ON public.assistance_requests(tracking_token);

-- 3. Drop the vulnerable policy
DROP POLICY IF EXISTS "Users can view their own requests" ON public.assistance_requests;

-- 4. Create a new secure policy for authenticated users only
CREATE POLICY "Users can view their own requests"
ON public.assistance_requests
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 5. Create a new policy for tracking anonymous requests via token
-- This uses a database function to check the tracking token securely
CREATE OR REPLACE FUNCTION public.verify_tracking_token(request_id uuid, token uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assistance_requests
    WHERE id = request_id
      AND tracking_token = token
  )
$$;

-- 6. Create a policy that allows viewing a specific request via tracking token
-- This requires both the request ID and token to be passed (verified server-side)
CREATE POLICY "Anyone can view request with valid tracking token"
ON public.assistance_requests
FOR SELECT
USING (
  -- This policy works with RPC calls that set request context
  -- The actual token verification happens in the edge function
  false
);

-- Note: Since RLS cannot directly access query parameters, 
-- we'll use an edge function to securely fetch requests by tracking token