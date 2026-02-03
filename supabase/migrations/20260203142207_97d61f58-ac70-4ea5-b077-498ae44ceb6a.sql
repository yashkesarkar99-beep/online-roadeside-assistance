-- Fix 1: Block direct access to pending_requests_preview
-- Only service_role (used by edge function) should be able to query this view
-- This ensures mechanics must use the edge function which validates their role

-- Revoke all privileges from authenticated and anon roles
REVOKE ALL ON public.pending_requests_preview FROM authenticated;
REVOKE ALL ON public.pending_requests_preview FROM anon;

-- The service_role (used by edge function) retains access as it's a superuser role

-- Fix 2: Remove direct mechanic SELECT on pending assistance_requests
-- Mechanics should ONLY see pending requests through the masked view via edge function
-- They already have policies for their assigned requests

-- Check if there's a mechanic SELECT policy for pending requests and drop it if exists
-- (The "Mechanics can view their assigned requests" policy already limits to assigned_mechanic_id = auth.uid())

-- No changes needed for assistance_requests as the current policies already:
-- 1. Only allow mechanics to VIEW their assigned requests (not all pending)
-- 2. Only allow mechanics to UPDATE pending to accepted (assigning to themselves)
-- 3. Only allow mechanics to UPDATE their assigned requests

-- The scan is confused because UPDATE requires implicit SELECT, but the RLS
-- correctly restricts what rows are visible during the UPDATE operation