
-- 1) Notifications: drop permissive INSERT; SECURITY DEFINER triggers still bypass RLS
DROP POLICY IF EXISTS "System inserts allowed via definer functions" ON public.notifications;

-- 2) Pitch ratings: scope SELECT to participants/admins
DROP POLICY IF EXISTS "Ratings public-read" ON public.pitch_ratings;
CREATE POLICY "Ratings viewable by participants"
  ON public.pitch_ratings FOR SELECT TO authenticated
  USING (
    auth.uid() = rater_id
    OR auth.uid() = ratee_id
    OR EXISTS (
      SELECT 1 FROM public.pitches p
      WHERE p.id = pitch_ratings.pitch_id
        AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id)
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 3) Profiles: restrict SELECT to own row or admin
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public-safe profile fields exposed via SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  full_name text,
  company_name text,
  account_type public.account_type,
  website text,
  logo_url text,
  bio text,
  industry text,
  one_liner text,
  stage text,
  hq_city text,
  country text,
  overall_rating numeric,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, full_name, company_name, account_type, website, logo_url, bio, industry,
         one_liner, stage, hq_city, country, overall_rating, is_verified
  FROM public.profiles
  WHERE user_id = ANY(_user_ids);
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

-- Pitch contact reveal: counterparty email/website only at Stage 4
CREATE OR REPLACE FUNCTION public.get_pitch_contact(_pitch_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  company_name text,
  account_type public.account_type,
  email text,
  website text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _s uuid; _c uuid; _s4 boolean;
BEGIN
  SELECT startup_id, target_company_id, stage_4_unlocked
    INTO _s, _c, _s4
    FROM public.pitches WHERE id = _pitch_id;
  IF auth.uid() IS NULL OR auth.uid() NOT IN (_s, _c) THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT p.user_id, p.full_name, p.company_name, p.account_type,
           CASE WHEN _s4 THEN p.email   ELSE NULL END,
           CASE WHEN _s4 THEN p.website ELSE NULL END
    FROM public.profiles p
    WHERE p.user_id IN (_s, _c);
END $$;
REVOKE EXECUTE ON FUNCTION public.get_pitch_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pitch_contact(uuid) TO authenticated;

-- 4) Storage: tighten pitch-files INSERT to require Stage 4 participation
DROP POLICY IF EXISTS "Pitch files writable by participants at stage 4" ON storage.objects;
CREATE POLICY "Pitch files writable by participants at stage 4"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pitch-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.pitches p
    WHERE p.id::text = (storage.foldername(name))[2]
      AND p.stage_4_unlocked = true
      AND (auth.uid() = p.startup_id OR auth.uid() = p.target_company_id)
  )
);

-- 5) Storage: restrict logos listing to owners (public URL access still works)
DROP POLICY IF EXISTS "Logos public read" ON storage.objects;
CREATE POLICY "Logos listable by owner"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6) Revoke execute on internal trigger functions
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.handle_new_user()',
    'public.notify_message()',
    'public.notify_response()',
    'public.notify_pitch_created()',
    'public.enforce_message_cap()',
    'public.enforce_pitch_rate_limit()',
    'public.block_contact_sharing()',
    'public.check_pitch_similarity()',
    'public.warn_pitch_quota()',
    'public.recompute_overall_rating()',
    'public.apply_payment_verification()',
    'public.auto_unlock_stage3()',
    'public.update_updated_at_column()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;
