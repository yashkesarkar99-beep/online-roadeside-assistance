-- Add admin SELECT policy for assistance_requests
CREATE POLICY "Admins can view all requests"
ON public.assistance_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin SELECT policy for profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));