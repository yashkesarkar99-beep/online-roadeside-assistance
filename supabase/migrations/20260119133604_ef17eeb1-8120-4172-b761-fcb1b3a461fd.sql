-- Add NULL handling to security definer functions for defense-in-depth
-- Also add CHECK constraints for server-side input validation

-- Update is_mechanic function with NULL check
CREATE OR REPLACE FUNCTION public.is_mechanic(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return false for NULL input
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN COALESCE(
    (SELECT is_mechanic FROM public.profiles WHERE user_id = user_uuid),
    false
  );
END;
$$;

-- Update has_role function with NULL check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return false for NULL inputs
  IF _user_id IS NULL OR _role IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Add CHECK constraints for server-side input validation on assistance_requests
-- Validate coordinates are in valid range
ALTER TABLE public.assistance_requests
ADD CONSTRAINT check_location_lat CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90));

ALTER TABLE public.assistance_requests
ADD CONSTRAINT check_location_lng CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180));

-- Validate vehicle year format and range
ALTER TABLE public.assistance_requests
ADD CONSTRAINT check_vehicle_year CHECK (vehicle_year ~ '^[0-9]{4}$' AND vehicle_year::int BETWEEN 1900 AND 2100);

-- Validate contact name length
ALTER TABLE public.assistance_requests
ADD CONSTRAINT check_contact_name_length CHECK (char_length(contact_name) >= 2 AND char_length(contact_name) <= 100);

-- Validate contact phone format (basic pattern)
ALTER TABLE public.assistance_requests
ADD CONSTRAINT check_contact_phone CHECK (char_length(contact_phone) >= 10 AND char_length(contact_phone) <= 20);