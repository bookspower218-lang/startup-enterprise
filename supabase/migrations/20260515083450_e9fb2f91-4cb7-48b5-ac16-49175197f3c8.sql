
-- Allow companies (validators) to view all pitches
DROP POLICY IF EXISTS "Pitches viewable by participants" ON public.pitches;
CREATE POLICY "Pitches viewable"
ON public.pitches FOR SELECT TO authenticated
USING (
  auth.uid() = startup_id
  OR target_company_id IS NULL
  OR auth.uid() = target_company_id
  OR public.has_role(auth.uid(), 'company'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Payment proof column
ALTER TABLE public.pitch_payments
  ADD COLUMN IF NOT EXISTS proof_path text;

-- Replica identity full for messages so UPDATE events also include payload
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.pitch_responses REPLICA IDENTITY FULL;

-- Add pitch_responses to realtime publication if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='pitch_responses'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.pitch_responses';
  END IF;
END $$;

-- Storage bucket for payment proofs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Payers upload own proof" ON storage.objects;
CREATE POLICY "Payers upload own proof"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Payers view own proof" ON storage.objects;
CREATE POLICY "Payers view own proof"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);
