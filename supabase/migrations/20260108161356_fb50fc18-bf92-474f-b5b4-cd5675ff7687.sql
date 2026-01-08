-- Create enum for service types
CREATE TYPE public.service_type AS ENUM (
  'flat_tire',
  'battery_jump',
  'fuel_delivery',
  'towing',
  'lockout',
  'accident_recovery'
);

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM (
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'cancelled'
);

-- Create assistance_requests table
CREATE TABLE public.assistance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type service_type NOT NULL,
  location_address TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year TEXT NOT NULL,
  vehicle_color TEXT,
  issue_description TEXT,
  status request_status NOT NULL DEFAULT 'pending',
  assigned_mechanic_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_mechanic BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assistance_requests
-- Anyone can create a request (for guests)
CREATE POLICY "Anyone can create assistance requests"
ON public.assistance_requests
FOR INSERT
WITH CHECK (true);

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.assistance_requests
FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

-- Mechanics can view pending requests
CREATE POLICY "Mechanics can view pending requests"
ON public.assistance_requests
FOR SELECT
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_mechanic = true
  )
);

-- Mechanics can update requests they're assigned to
CREATE POLICY "Mechanics can update assigned requests"
ON public.assistance_requests
FOR UPDATE
USING (
  assigned_mechanic_id = auth.uid() OR
  (status = 'pending' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_mechanic = true
  ))
);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Mechanics can view all profiles (to see customer info)
CREATE POLICY "Mechanics can view profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_mechanic = true
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_assistance_requests_updated_at
BEFORE UPDATE ON public.assistance_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for assistance_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.assistance_requests;