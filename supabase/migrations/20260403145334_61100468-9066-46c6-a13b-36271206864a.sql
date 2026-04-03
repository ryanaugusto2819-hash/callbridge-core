
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (no auth yet)
CREATE POLICY "Anyone can read settings" ON public.settings
  FOR SELECT USING (true);

-- Allow anyone to insert settings
CREATE POLICY "Anyone can insert settings" ON public.settings
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update settings
CREATE POLICY "Anyone can update settings" ON public.settings
  FOR UPDATE USING (true) WITH CHECK (true);
