
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_contacts integer NOT NULL DEFAULT 0,
  called integer NOT NULL DEFAULT 0,
  answered integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO anon, authenticated;
GRANT ALL ON public.campaigns TO service_role;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read campaigns"   ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Anyone can insert campaigns" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update campaigns" ON public.campaigns FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete campaigns" ON public.campaigns FOR DELETE USING (true);

CREATE TABLE public.campaign_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX campaign_contacts_campaign_id_idx ON public.campaign_contacts(campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_contacts TO anon, authenticated;
GRANT ALL ON public.campaign_contacts TO service_role;

ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read campaign_contacts"   ON public.campaign_contacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert campaign_contacts" ON public.campaign_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update campaign_contacts" ON public.campaign_contacts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete campaign_contacts" ON public.campaign_contacts FOR DELETE USING (true);
