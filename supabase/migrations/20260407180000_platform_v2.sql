-- === CALL LOGS: adicionar campos de contato e agente ===
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_name   TEXT,
  ADD COLUMN IF NOT EXISTS campaign_id  UUID;

-- === SCRIPTS ===
CREATE TABLE IF NOT EXISTS public.scripts (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'Saída',
  content          TEXT NOT NULL DEFAULT '',
  response_options JSONB DEFAULT '[]'::jsonb,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scripts_all" ON public.scripts FOR ALL USING (true) WITH CHECK (true);

-- === CAMPANHAS (Discadora automática) ===
CREATE TABLE IF NOT EXISTS public.campaigns (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','running','paused','completed')),
  total_contacts  INTEGER DEFAULT 0,
  called          INTEGER DEFAULT 0,
  answered        INTEGER DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_all" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

-- === CONTATOS DE CAMPANHA ===
CREATE TABLE IF NOT EXISTS public.campaign_contacts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id  UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name         TEXT,
  phone        TEXT NOT NULL,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','calling','answered','no-answer','failed','skipped')),
  call_log_id  UUID,
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_contacts_all" ON public.campaign_contacts FOR ALL USING (true) WITH CHECK (true);
