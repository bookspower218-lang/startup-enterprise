
-- Free trial: first 5 distinct companies showing interest unlock Stage 4 without payment proof.

CREATE OR REPLACE FUNCTION public.free_trial_company_limit()
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 5;
$$;

CREATE OR REPLACE FUNCTION public.startup_interested_company_count(_startup_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(DISTINCT p.target_company_id)::int
  FROM public.pitches p
  JOIN public.pitch_responses r ON r.pitch_id = p.id
  WHERE p.startup_id = _startup_id
    AND p.target_company_id IS NOT NULL
    AND r.decision::text = 'interested';
$$;

CREATE OR REPLACE FUNCTION public.startup_free_trial_remaining(_startup_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, public.free_trial_company_limit() - public.startup_interested_company_count(_startup_id));
$$;

CREATE OR REPLACE FUNCTION public.pitch_qualifies_for_free_trial(_pitch_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _startup uuid;
  _company uuid;
  _interest_at timestamptz;
  _company_rank int;
BEGIN
  SELECT p.startup_id, p.target_company_id
    INTO _startup, _company
  FROM public.pitches p
  WHERE p.id = _pitch_id;

  IF _startup IS NULL OR _company IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.pitch_responses r
    WHERE r.pitch_id = _pitch_id
      AND r.decision::text = 'interested'
  ) THEN
    RETURN false;
  END IF;

  SELECT r.created_at
    INTO _interest_at
  FROM public.pitch_responses r
  WHERE r.pitch_id = _pitch_id
    AND r.decision::text = 'interested'
  ORDER BY r.created_at
  LIMIT 1;

  SELECT count(*)::int
    INTO _company_rank
  FROM (
    SELECT p.target_company_id, min(r.created_at) AS first_interest_at
    FROM public.pitches p
    JOIN public.pitch_responses r ON r.pitch_id = p.id
    WHERE p.startup_id = _startup
      AND p.target_company_id IS NOT NULL
      AND r.decision::text = 'interested'
    GROUP BY p.target_company_id
  ) ranked
  WHERE ranked.first_interest_at <= _interest_at;

  RETURN _company_rank <= public.free_trial_company_limit();
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_free_trial_stage4(_pitch_id uuid, _slot int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pitches
    SET stage_4_unlocked = true,
        stage_3_unlocked = true
  WHERE id = _pitch_id;

  INSERT INTO public.pitch_payments (
    pitch_id, payer_id, tier, amount, status, reference_note, gateway, verified_at
  )
  SELECT
    p.id,
    p.startup_id,
    'stage_4'::public.payment_tier,
    0,
    'verified'::public.pay_status,
    format('Free trial — company %s of %s', _slot, public.free_trial_company_limit()),
    'free_trial',
    now()
  FROM public.pitches p
  WHERE p.id = _pitch_id
  ON CONFLICT (pitch_id, tier) DO UPDATE
    SET status = 'verified',
        amount = 0,
        reference_note = EXCLUDED.reference_note,
        gateway = 'free_trial',
        verified_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_unlock_stage3()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _startup uuid;
  _company uuid;
  existing_companies int;
BEGIN
  IF NEW.decision::text <> 'interested' THEN
    RETURN NEW;
  END IF;

  SELECT p.startup_id, p.target_company_id
    INTO _startup, _company
  FROM public.pitches p
  WHERE p.id = NEW.pitch_id;

  UPDATE public.pitches
    SET stage_3_unlocked = true
  WHERE id = NEW.pitch_id;

  IF _company IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(DISTINCT p.target_company_id)
    INTO existing_companies
  FROM public.pitches p
  JOIN public.pitch_responses r ON r.pitch_id = p.id
  WHERE p.startup_id = _startup
    AND p.target_company_id IS NOT NULL
    AND r.decision::text = 'interested'
    AND p.id <> NEW.pitch_id;

  IF existing_companies < public.free_trial_company_limit() THEN
    PERFORM public.grant_free_trial_stage4(NEW.pitch_id, existing_companies + 1);
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill: unlock Stage 4 for existing interested pitches within the first 5 companies per startup.
DO $$
DECLARE
  rec record;
  slot int;
BEGIN
  FOR rec IN
    SELECT p.id AS pitch_id, p.startup_id, p.target_company_id, min(r.created_at) AS interest_at
    FROM public.pitches p
    JOIN public.pitch_responses r ON r.pitch_id = p.id
    WHERE p.target_company_id IS NOT NULL
      AND r.decision::text = 'interested'
    GROUP BY p.id, p.startup_id, p.target_company_id
  LOOP
    SELECT count(*)::int
      INTO slot
    FROM (
      SELECT p2.target_company_id, min(r2.created_at) AS first_interest_at
      FROM public.pitches p2
      JOIN public.pitch_responses r2 ON r2.pitch_id = p2.id
      WHERE p2.startup_id = rec.startup_id
        AND p2.target_company_id IS NOT NULL
        AND r2.decision::text = 'interested'
      GROUP BY p2.target_company_id
    ) ranked
    WHERE ranked.first_interest_at <= rec.interest_at;

    IF slot <= public.free_trial_company_limit() THEN
      PERFORM public.grant_free_trial_stage4(rec.pitch_id, slot);
    END IF;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.free_trial_company_limit() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.startup_interested_company_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.startup_free_trial_remaining(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pitch_qualifies_for_free_trial(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_free_trial_stage4(uuid, int) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.startup_interested_company_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.startup_free_trial_remaining(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pitch_qualifies_for_free_trial(uuid) TO authenticated;
