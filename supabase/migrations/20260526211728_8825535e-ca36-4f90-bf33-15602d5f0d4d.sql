
CREATE TABLE public.scripts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Saída',
  content text NOT NULL DEFAULT '',
  response_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scripts TO anon, authenticated;
GRANT ALL ON public.scripts TO service_role;

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scripts"   ON public.scripts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scripts" ON public.scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scripts" ON public.scripts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete scripts" ON public.scripts FOR DELETE USING (true);
