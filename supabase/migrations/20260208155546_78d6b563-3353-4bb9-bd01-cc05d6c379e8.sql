-- Create SMS notification log table
CREATE TABLE public.sms_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.assistance_requests(id) ON DELETE CASCADE,
  mechanic_id UUID NOT NULL,
  recipient_phone TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('dispatched', 'arrived')),
  message_sid TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;

-- Mechanics can view notification logs for their assigned requests
CREATE POLICY "Mechanics can view their notification logs"
ON public.sms_notifications
FOR SELECT
TO authenticated
USING (
  mechanic_id = auth.uid() AND is_mechanic(auth.uid())
);

-- Admins can view all notification logs
CREATE POLICY "Admins can view all notification logs"
ON public.sms_notifications
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only service role inserts (from edge function), no direct insert policy needed for users

-- Add index for efficient lookups
CREATE INDEX idx_sms_notifications_request_id ON public.sms_notifications(request_id);
CREATE INDEX idx_sms_notifications_mechanic_id ON public.sms_notifications(mechanic_id);