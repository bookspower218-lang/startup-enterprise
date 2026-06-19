
-- Allow startups to pitch up to 5 companies without PKR 5,000 registration (free trial).

CREATE OR REPLACE FUNCTION public.enforce_startup_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ps public.payment_status;
  distinct_companies int;
  already_pitched boolean;
BEGIN
  SELECT payment_status
    INTO ps
  FROM public.profiles
  WHERE user_id = NEW.startup_id;

  IF ps = 'verified' THEN
    RETURN NEW;
  END IF;

  IF NEW.target_company_id IS NULL THEN
    RAISE EXCEPTION 'Complete registration payment (PKR 5,000) before sending pitches.';
  END IF;

  SELECT count(DISTINCT target_company_id)
    INTO distinct_companies
  FROM public.pitches
  WHERE startup_id = NEW.startup_id
    AND target_company_id IS NOT NULL;

  SELECT EXISTS (
    SELECT 1
    FROM public.pitches
    WHERE startup_id = NEW.startup_id
      AND target_company_id = NEW.target_company_id
  ) INTO already_pitched;

  IF already_pitched OR distinct_companies < public.free_trial_company_limit() THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Complete registration payment (PKR 5,000) before sending pitches to more than % companies.', public.free_trial_company_limit();
  RETURN NEW;
END;
$$;
