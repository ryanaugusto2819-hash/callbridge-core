
CREATE TABLE public.audio_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  audio_url text NOT NULL,
  storage_path text,
  shortcut_key text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_clips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_clips TO authenticated;
GRANT ALL ON public.audio_clips TO service_role;

ALTER TABLE public.audio_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read audio_clips" ON public.audio_clips FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audio_clips" ON public.audio_clips FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update audio_clips" ON public.audio_clips FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete audio_clips" ON public.audio_clips FOR DELETE USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('call-audios', 'call-audios', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read call-audios" ON storage.objects FOR SELECT USING (bucket_id = 'call-audios');
CREATE POLICY "Public upload call-audios" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'call-audios');
CREATE POLICY "Public update call-audios" ON storage.objects FOR UPDATE USING (bucket_id = 'call-audios');
CREATE POLICY "Public delete call-audios" ON storage.objects FOR DELETE USING (bucket_id = 'call-audios');
