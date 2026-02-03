-- Tighten INSERT and UPDATE policies to reduce abuse and limit exposure of PII

-- 1) Assistance requests: keep anonymous creation, but prevent inserting privileged fields
DROP POLICY IF EXISTS "Anyone can create assistance requests" ON public.assistance_requests;
CREATE POLICY "Anyone can create assistance requests"
ON public.assistance_requests
FOR INSERT
TO public
WITH CHECK (
  status = 'pending'::request_status
  AND assigned_mechanic_id IS NULL
  AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
);

-- 2) Assistance requests: split mechanic UPDATE privileges
--    a) allow mechanics to accept a pending request only by assigning it to themselves
DROP POLICY IF EXISTS "Mechanics can update assigned requests" ON public.assistance_requests;

CREATE POLICY "Mechanics can accept pending requests"
ON public.assistance_requests
FOR UPDATE
TO public
USING (
  status = 'pending'::request_status
  AND is_mechanic(auth.uid())
)
WITH CHECK (
  status = 'accepted'::request_status
  AND assigned_mechanic_id = auth.uid()
);

--    b) allow mechanics to update only their already-assigned requests (cannot reassign)
CREATE POLICY "Mechanics can update their assigned requests"
ON public.assistance_requests
FOR UPDATE
TO public
USING (
  assigned_mechanic_id = auth.uid()
  AND is_mechanic(auth.uid())
)
WITH CHECK (
  assigned_mechanic_id = auth.uid()
);

-- 3) Profiles: mechanics should only see customer phone numbers for active work
DROP POLICY IF EXISTS "Mechanics can view assigned customer profiles" ON public.profiles;
CREATE POLICY "Mechanics can view assigned customer profiles"
ON public.profiles
FOR SELECT
TO public
USING (
  is_mechanic(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.assistance_requests ar
    WHERE ar.assigned_mechanic_id = auth.uid()
      AND ar.user_id = profiles.user_id
      AND ar.status IN ('accepted'::request_status, 'in_progress'::request_status)
  )
);
