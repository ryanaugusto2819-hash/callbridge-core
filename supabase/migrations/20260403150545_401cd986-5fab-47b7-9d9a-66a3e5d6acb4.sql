
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id UUID,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled')),
  duration INTEGER DEFAULT 0,
  recording_url TEXT,
  twilio_call_sid TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read call_logs" ON public.call_logs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert call_logs" ON public.call_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update call_logs" ON public.call_logs
  FOR UPDATE USING (true) WITH CHECK (true);
