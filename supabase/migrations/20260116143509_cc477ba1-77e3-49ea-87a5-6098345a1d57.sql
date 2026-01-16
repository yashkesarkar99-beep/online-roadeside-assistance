-- Remove the placeholder policy that always returns false (not needed)
DROP POLICY IF EXISTS "Anyone can view request with valid tracking token" ON public.assistance_requests;