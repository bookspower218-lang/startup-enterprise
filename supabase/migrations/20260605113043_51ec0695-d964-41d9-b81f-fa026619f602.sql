
CREATE OR REPLACE FUNCTION public.list_company_profiles()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  company_name text,
  industry text,
  logo_url text,
  one_liner text,
  is_verified boolean,
  overall_rating numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, full_name, company_name, industry, logo_url, one_liner, is_verified, overall_rating
  FROM public.profiles
  WHERE account_type = 'company' AND is_suspended = false
  ORDER BY company_name NULLS LAST;
$$;
REVOKE EXECUTE ON FUNCTION public.list_company_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_company_profiles() TO authenticated;
