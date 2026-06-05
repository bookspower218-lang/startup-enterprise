
-- ============== PROFILES: extended fields ==============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS one_liner text,
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS hq_city text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS target_industries text[],
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_reason text,
  ADD COLUMN IF NOT EXISTS response_rate int NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS overall_rating numeric(3,2);

-- ============== PAYMENTS: refund + invoice ==============
ALTER TABLE public.pitch_payments
  ADD COLUMN IF NOT EXISTS partial_refund_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS invoice_url text,
  ADD COLUMN IF NOT EXISTS gateway text NOT NULL DEFAULT 'manual';

-- Tighten payment SELECT: payer + admin only (no cross-participant reads)
DROP POLICY IF EXISTS "Payments viewable by participants or admin" ON public.pitch_payments;
CREATE POLICY "Payments viewable by payer or admin" ON public.pitch_payments
  FOR SELECT TO authenticated
  USING (auth.uid() = payer_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============== NOTIFICATION PREFS ==============
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.user_notification_prefs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== SLA EMAILS DEDUPE ==============
CREATE TABLE IF NOT EXISTS public.sla_emails_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pitch_id, kind)
);
ALTER TABLE public.sla_emails_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sla log" ON public.sla_emails_sent
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============== AUDIT LOG ==============
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_type text,
  target_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============== MODERATED MESSAGES ==============
CREATE TABLE IF NOT EXISTS public.moderated_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moderated_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read moderation" ON public.moderated_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update moderation" ON public.moderated_messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============== ONBOARDING STATE ==============
CREATE TABLE IF NOT EXISTS public.onboarding_state (
  user_id uuid PRIMARY KEY,
  profile_done boolean NOT NULL DEFAULT false,
  browsed boolean NOT NULL DEFAULT false,
  pitched boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding" ON public.onboarding_state
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============== LOGOS BUCKET ==============
INSERT INTO storage.buckets (id, name, public)
  VALUES ('logos', 'logos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Users upload own logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own logo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own logo" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============== RATING AGGREGATE TRIGGER ==============
CREATE OR REPLACE FUNCTION public.recompute_overall_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET overall_rating = (
      SELECT round(avg((communication + professionalism + follow_through)::numeric / 3.0), 2)
      FROM public.pitch_ratings WHERE ratee_id = NEW.ratee_id
    )
    WHERE user_id = NEW.ratee_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_recompute_rating ON public.pitch_ratings;
CREATE TRIGGER trg_recompute_rating
AFTER INSERT OR UPDATE ON public.pitch_ratings
FOR EACH ROW EXECUTE FUNCTION public.recompute_overall_rating();

-- ============== PITCH RATE LIMIT (10/hour) ==============
CREATE OR REPLACE FUNCTION public.enforce_pitch_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.pitches
   WHERE startup_id = NEW.startup_id
     AND created_at > now() - interval '1 hour';
  IF cnt >= 10 THEN
    RAISE EXCEPTION 'Rate limit: max 10 pitches per hour. Please slow down.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_pitch_rate_limit ON public.pitches;
CREATE TRIGGER trg_pitch_rate_limit
BEFORE INSERT ON public.pitches
FOR EACH ROW EXECUTE FUNCTION public.enforce_pitch_rate_limit();

-- ============== UPDATE block_contact_sharing TO LOG ==============
CREATE OR REPLACE FUNCTION public.block_contact_sharing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE s4 boolean; reason text;
BEGIN
  SELECT stage_4_unlocked INTO s4 FROM public.pitches WHERE id = NEW.pitch_id;
  IF s4 THEN RETURN NEW; END IF;
  reason := NULL;
  IF NEW.body ~* '([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})' THEN reason := 'email';
  ELSIF NEW.body ~* '(\+?\d[\d\s\-\(\)]{7,}\d)' THEN reason := 'phone';
  ELSIF NEW.body ~* '(wa\.me|whatsapp|t\.me|telegram|zoom\.us|meet\.google|linkedin\.com|instagram\.com|facebook\.com|twitter\.com|x\.com/)' THEN reason := 'external_link';
  END IF;
  IF reason IS NOT NULL THEN
    INSERT INTO public.moderated_messages(pitch_id, sender_id, body, reason)
      VALUES (NEW.pitch_id, NEW.sender_id, NEW.body, reason);
    RAISE EXCEPTION 'Direct contact sharing is not allowed at this stage. Complete payment to unlock full contact details.';
  END IF;
  RETURN NEW;
END $$;
