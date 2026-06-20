
-- Fix messaging RLS + ensure interest/free-trial unlocks stages.

-- 1) Backfill: any interested pitch must have Stage 3 unlocked
UPDATE public.pitches p
SET stage_3_unlocked = true
WHERE EXISTS (
  SELECT 1 FROM public.pitch_responses r
  WHERE r.pitch_id = p.id AND r.decision::text = 'interested'
)
AND stage_3_unlocked = false;

-- 2) Backfill: free-trial pitches get Stage 4
DO $$
DECLARE rec record; slot int;
BEGIN
  FOR rec IN
    SELECT p.id AS pitch_id, p.startup_id, min(r.created_at) AS interest_at
    FROM public.pitches p
    JOIN public.pitch_responses r ON r.pitch_id = p.id
    WHERE p.target_company_id IS NOT NULL AND r.decision::text = 'interested'
    GROUP BY p.id, p.startup_id
  LOOP
    SELECT count(*)::int INTO slot
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

-- 3) Messages INSERT: allow participants once interest is shown (Stage 3 auto-unlocks)
DROP POLICY IF EXISTS "Participants can send messages after interest" ON public.messages;
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
        WHERE r.pitch_id = p.id AND r.decision::text = 'interested'
      )
    )
  );
