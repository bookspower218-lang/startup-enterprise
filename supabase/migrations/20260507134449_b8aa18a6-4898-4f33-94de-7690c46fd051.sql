
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Stage tracking on pitches
ALTER TABLE public.pitches
  ADD COLUMN IF NOT EXISTS stage_3_unlocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stage_4_unlocked boolean NOT NULL DEFAULT false;

-- Payments table
CREATE TYPE public.payment_tier AS ENUM ('stage_3','stage_4');
CREATE TYPE public.pay_status AS ENUM ('pending','verified','rejected');

CREATE TABLE public.pitch_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL,
  payer_id uuid NOT NULL,
  tier public.payment_tier NOT NULL,
  amount numeric NOT NULL,
  reference_note text,
  status public.pay_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  UNIQUE (pitch_id, tier)
);
ALTER TABLE public.pitch_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments viewable by participants or admin"
  ON public.pitch_payments FOR SELECT TO authenticated
  USING (
    auth.uid() = payer_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id))
  );

CREATE POLICY "Participants submit payments"
  ON public.pitch_payments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = payer_id
    AND EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id))
  );

CREATE POLICY "Admins verify payments"
  ON public.pitch_payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- When a payment is verified, unlock corresponding stage on the pitch
CREATE OR REPLACE FUNCTION public.apply_payment_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _startup uuid;
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified') THEN
    IF NEW.tier = 'stage_3' THEN
      UPDATE public.pitches SET stage_3_unlocked = true WHERE id = NEW.pitch_id;
    ELSIF NEW.tier = 'stage_4' THEN
      UPDATE public.pitches SET stage_4_unlocked = true, stage_3_unlocked = true WHERE id = NEW.pitch_id;
    END IF;
    SELECT startup_id INTO _startup FROM public.pitches WHERE id = NEW.pitch_id;
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (NEW.payer_id, 'payment_verified', 'Payment verified',
            CASE WHEN NEW.tier = 'stage_4' THEN 'Stage 4 unlocked: contacts, files, scheduling.' ELSE 'Stage 3 messaging fully unlocked.' END,
            '/pitches/' || NEW.pitch_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_apply_payment AFTER UPDATE ON public.pitch_payments
  FOR EACH ROW EXECUTE FUNCTION public.apply_payment_verification();

-- Update message cap: skip when stage_4_unlocked
CREATE OR REPLACE FUNCTION public.enforce_message_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cnt int; s4 boolean;
BEGIN
  SELECT stage_4_unlocked INTO s4 FROM public.pitches WHERE id = NEW.pitch_id;
  IF s4 THEN RETURN NEW; END IF;
  SELECT count(*) INTO cnt FROM public.messages WHERE pitch_id = NEW.pitch_id AND sender_id = NEW.sender_id;
  IF cnt >= 10 THEN RAISE EXCEPTION 'Message limit reached (10 per side at this stage).'; END IF;
  RETURN NEW;
END $$;

-- Update contact-sharing block: skip at stage 4
CREATE OR REPLACE FUNCTION public.block_contact_sharing()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE s4 boolean;
BEGIN
  SELECT stage_4_unlocked INTO s4 FROM public.pitches WHERE id = NEW.pitch_id;
  IF s4 THEN RETURN NEW; END IF;
  IF NEW.body ~* '([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})'
     OR NEW.body ~* '(\+?\d[\d\s\-\(\)]{7,}\d)'
     OR NEW.body ~* '(wa\.me|whatsapp|t\.me|telegram|zoom\.us|meet\.google|linkedin\.com|instagram\.com|facebook\.com|twitter\.com|x\.com/)'
  THEN RAISE EXCEPTION 'Direct contact sharing is not allowed at this stage. Complete payment to unlock full contact details.'; END IF;
  RETURN NEW;
END $$;

-- Make sure triggers exist on messages
DROP TRIGGER IF EXISTS trg_msg_cap ON public.messages;
CREATE TRIGGER trg_msg_cap BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.enforce_message_cap();
DROP TRIGGER IF EXISTS trg_msg_filter ON public.messages;
CREATE TRIGGER trg_msg_filter BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.block_contact_sharing();
DROP TRIGGER IF EXISTS trg_msg_notify ON public.messages;
CREATE TRIGGER trg_msg_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_message();

-- Make sure response triggers exist
DROP TRIGGER IF EXISTS trg_response_notify ON public.pitch_responses;
CREATE TRIGGER trg_response_notify AFTER INSERT ON public.pitch_responses FOR EACH ROW EXECUTE FUNCTION public.notify_response();
DROP TRIGGER IF EXISTS trg_pitch_notify ON public.pitches;
CREATE TRIGGER trg_pitch_notify AFTER INSERT ON public.pitches FOR EACH ROW EXECUTE FUNCTION public.notify_pitch_created();

-- Auto-unlock stage 3 when interested
CREATE OR REPLACE FUNCTION public.auto_unlock_stage3()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.decision::text = 'interested' THEN
    UPDATE public.pitches SET stage_3_unlocked = true WHERE id = NEW.pitch_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auto_stage3 ON public.pitch_responses;
CREATE TRIGGER trg_auto_stage3 AFTER INSERT ON public.pitch_responses FOR EACH ROW EXECUTE FUNCTION public.auto_unlock_stage3();

-- Attachments
CREATE TABLE public.pitch_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL,
  uploader_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pitch_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attachments viewable by participants" ON public.pitch_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id)));
CREATE POLICY "Participants upload at stage 4" ON public.pitch_attachments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = uploader_id
    AND EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND p.stage_4_unlocked = true AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id))
  );

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('pitch-files','pitch-files', false) ON CONFLICT DO NOTHING;
CREATE POLICY "Pitch files readable by participants" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'pitch-files'
    AND EXISTS (
      SELECT 1 FROM public.pitch_attachments a
      JOIN public.pitches p ON p.id = a.pitch_id
      WHERE a.file_path = name AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id)
    )
  );
CREATE POLICY "Pitch files writable by participants at stage 4" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pitch-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Meetings
CREATE TABLE public.pitch_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL,
  proposer_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pitch_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Meetings viewable by participants" ON public.pitch_meetings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id)));
CREATE POLICY "Participants schedule at stage 4" ON public.pitch_meetings FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = proposer_id
    AND EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND p.stage_4_unlocked = true AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id))
  );

-- Ratings
CREATE TABLE public.pitch_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL,
  rater_id uuid NOT NULL,
  ratee_id uuid NOT NULL,
  communication smallint NOT NULL CHECK (communication BETWEEN 1 AND 3),
  professionalism smallint NOT NULL CHECK (professionalism BETWEEN 1 AND 3),
  follow_through smallint NOT NULL CHECK (follow_through BETWEEN 1 AND 3),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pitch_id, rater_id)
);
ALTER TABLE public.pitch_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings public-read" ON public.pitch_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Participants rate after stage 4" ON public.pitch_ratings FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = rater_id
    AND EXISTS (SELECT 1 FROM public.pitches p WHERE p.id = pitch_id AND p.stage_4_unlocked = true AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id))
  );

-- Average rating helper
CREATE OR REPLACE FUNCTION public.user_avg_rating(_uid uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT round(avg((communication + professionalism + follow_through)::numeric / 3.0), 2)
  FROM public.pitch_ratings WHERE ratee_id = _uid;
$$;

-- Similarity check on new pitches (warn via notification if 70%+ match prior pitch by same startup)
CREATE OR REPLACE FUNCTION public.check_pitch_similarity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sim_score numeric;
BEGIN
  SELECT max(similarity(coalesce(p.problem,'') || ' ' || coalesce(p.solution,''),
                        coalesce(NEW.problem,'') || ' ' || coalesce(NEW.solution,'')))
  INTO sim_score
  FROM public.pitches p
  WHERE p.startup_id = NEW.startup_id AND p.id <> NEW.id;
  IF sim_score IS NOT NULL AND sim_score >= 0.7 THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (NEW.startup_id, 'duplicate_warning', 'Possible duplicate pitch',
            'This pitch is very similar to a previous one ('|| round(sim_score*100) ||'% match).', '/pitches');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_pitch_similarity ON public.pitches;
CREATE TRIGGER trg_pitch_similarity AFTER INSERT ON public.pitches FOR EACH ROW EXECUTE FUNCTION public.check_pitch_similarity();

-- 80% pitch-limit warning notifier
CREATE OR REPLACE FUNCTION public.warn_pitch_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE used int; lim int;
BEGIN
  SELECT public.monthly_pitch_count(NEW.startup_id) INTO used;
  SELECT public.plan_pitch_limit(NEW.startup_id) INTO lim;
  IF lim < 1000000 AND used >= ceil(lim * 0.8) AND used < lim THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (NEW.startup_id, 'quota_warning', 'You''re running low on pitches',
            'You have used '|| used ||' of '|| lim ||' monthly pitches.', '/pitches/new');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_quota_warn ON public.pitches;
CREATE TRIGGER trg_quota_warn AFTER INSERT ON public.pitches FOR EACH ROW EXECUTE FUNCTION public.warn_pitch_quota();
