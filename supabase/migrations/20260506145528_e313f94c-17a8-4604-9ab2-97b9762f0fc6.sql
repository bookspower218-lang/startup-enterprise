
-- Add structured pitch fields & target company
ALTER TABLE public.pitches
  ADD COLUMN IF NOT EXISTS target_company_id uuid,
  ADD COLUMN IF NOT EXISTS problem text,
  ADD COLUMN IF NOT EXISTS solution text,
  ADD COLUMN IF NOT EXISTS short_note text;

-- Make legacy fields nullable for new structured flow
ALTER TABLE public.pitches ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.pitches ALTER COLUMN description DROP NOT NULL;

-- One open pitch per (startup, target_company)
CREATE UNIQUE INDEX IF NOT EXISTS pitches_unique_open_per_company
  ON public.pitches(startup_id, target_company_id)
  WHERE target_company_id IS NOT NULL AND status = 'open';

-- Tighten pitches SELECT: viewable by author + targeted company only
DROP POLICY IF EXISTS "Pitches viewable by authenticated" ON public.pitches;
CREATE POLICY "Pitches viewable by participants"
  ON public.pitches FOR SELECT TO authenticated
  USING (
    auth.uid() = startup_id
    OR (target_company_id IS NOT NULL AND auth.uid() = target_company_id)
    OR target_company_id IS NULL  -- legacy open browse
  );

-- pitch_responses: ensure values 'interested' and 'pass' both work
DO $$ BEGIN
  ALTER TYPE public.response_decision ADD VALUE IF NOT EXISTS 'pass';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL REFERENCES public.pitches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages viewable by pitch participants"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches p
      WHERE p.id = messages.pitch_id
      AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id)
    )
  );

CREATE POLICY "Participants can send messages after interest"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.pitches p
      WHERE p.id = messages.pitch_id
      AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id)
      AND EXISTS (
        SELECT 1 FROM public.pitch_responses r
        WHERE r.pitch_id = p.id AND r.decision = 'interested'
      )
    )
  );

CREATE POLICY "Participants mark read"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches p
      WHERE p.id = messages.pitch_id
      AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id)
    )
  );

-- Per-side cap of 10 messages enforced via trigger
CREATE OR REPLACE FUNCTION public.enforce_message_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.messages
    WHERE pitch_id = NEW.pitch_id AND sender_id = NEW.sender_id;
  IF cnt >= 10 THEN
    RAISE EXCEPTION 'Message limit reached (10 per side at this stage).';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_message_cap ON public.messages;
CREATE TRIGGER trg_message_cap BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_cap();

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "System inserts allowed via definer functions"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Notify on new pitch (to target company)
CREATE OR REPLACE FUNCTION public.notify_pitch_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.target_company_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (NEW.target_company_id, 'pitch_received', 'New pitch received',
            COALESCE(NEW.problem, NEW.title, 'A startup sent you a pitch'),
            '/browse');
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (NEW.startup_id, 'pitch_sent', 'Pitch sent',
            'Your pitch was delivered. Awaiting company response.',
            '/pitches');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_pitch_created ON public.pitches;
CREATE TRIGGER trg_notify_pitch_created AFTER INSERT ON public.pitches
  FOR EACH ROW EXECUTE FUNCTION public.notify_pitch_created();

-- Notify on response
CREATE OR REPLACE FUNCTION public.notify_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _startup uuid; _title text;
BEGIN
  SELECT startup_id, COALESCE(problem, title, 'your pitch') INTO _startup, _title
    FROM public.pitches WHERE id = NEW.pitch_id;

  IF NEW.decision::text = 'interested' THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (_startup, 'interest_shown', 'A company is interested!',
            'Open the conversation to continue.', '/pitches/' || NEW.pitch_id);
  ELSE
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (_startup, 'pitch_passed', 'Company passed on your pitch',
            'You can pitch other companies.', '/pitches');
    UPDATE public.pitches SET status = 'closed' WHERE id = NEW.pitch_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_response ON public.pitch_responses;
CREATE TRIGGER trg_notify_response AFTER INSERT ON public.pitch_responses
  FOR EACH ROW EXECUTE FUNCTION public.notify_response();

-- Notify on message
CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _startup uuid; _company uuid; _recipient uuid;
BEGIN
  SELECT startup_id, target_company_id INTO _startup, _company
    FROM public.pitches WHERE id = NEW.pitch_id;
  _recipient := CASE WHEN NEW.sender_id = _startup THEN _company ELSE _startup END;
  IF _recipient IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (_recipient, 'message_received', 'New message',
            substring(NEW.body for 100), '/pitches/' || NEW.pitch_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message();

-- Block forbidden contact patterns server-side
CREATE OR REPLACE FUNCTION public.block_contact_sharing()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.body ~* '([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})'
     OR NEW.body ~* '(\+?\d[\d\s\-\(\)]{7,}\d)'
     OR NEW.body ~* '(wa\.me|whatsapp|t\.me|telegram|zoom\.us|meet\.google|linkedin\.com|instagram\.com|facebook\.com|twitter\.com|x\.com/)'
  THEN
    RAISE EXCEPTION 'Direct contact sharing is not allowed at this stage. Complete payment to unlock full contact details.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_block_contact ON public.messages;
CREATE TRIGGER trg_block_contact BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.block_contact_sharing();

-- Monthly pitch quota
CREATE OR REPLACE FUNCTION public.monthly_pitch_count(_uid uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.pitches
   WHERE startup_id = _uid
     AND created_at >= date_trunc('month', now());
$$;

CREATE OR REPLACE FUNCTION public.plan_pitch_limit(_uid uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE COALESCE((SELECT plan::text FROM public.profiles WHERE user_id = _uid), 'basic')
    WHEN 'basic' THEN 5
    WHEN 'pro'   THEN 15
    WHEN 'elite' THEN 1000000
    ELSE 5 END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
