-- Backend QA: free trial + payment bypass
-- Run after applying migration 20260620120000_startup_free_trial.sql

-- 1) Functions exist
SELECT proname
FROM pg_proc
WHERE proname IN (
  'free_trial_company_limit',
  'startup_interested_company_count',
  'startup_free_trial_remaining',
  'pitch_qualifies_for_free_trial',
  'grant_free_trial_stage4'
)
ORDER BY proname;

-- 2) Limit is 5
SELECT public.free_trial_company_limit() AS limit_should_be_5;

-- 3) Interested pitches in trial should have stage_4_unlocked + free_trial payment row
SELECT
  p.id,
  p.stage_4_unlocked,
  pp.gateway,
  pp.status,
  pp.amount,
  public.pitch_qualifies_for_free_trial(p.id) AS qualifies
FROM public.pitches p
LEFT JOIN public.pitch_payments pp ON pp.pitch_id = p.id AND pp.tier = 'stage_4'
WHERE EXISTS (
  SELECT 1 FROM public.pitch_responses r
  WHERE r.pitch_id = p.id AND r.decision::text = 'interested'
)
ORDER BY p.created_at DESC
LIMIT 20;

-- 4) No trial pitch should require proof while stage_4 is locked
SELECT count(*) AS broken_trial_rows
FROM public.pitches p
WHERE public.pitch_qualifies_for_free_trial(p.id)
  AND p.stage_4_unlocked = false;

-- Expected: broken_trial_rows = 0
