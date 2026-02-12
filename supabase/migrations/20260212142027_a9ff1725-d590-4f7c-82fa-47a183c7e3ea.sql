-- Revoke all direct access to pending_requests_preview from public roles
-- Only the service role (used in edge function) will be able to query this view
REVOKE ALL ON public.pending_requests_preview FROM anon;
REVOKE ALL ON public.pending_requests_preview FROM authenticated;