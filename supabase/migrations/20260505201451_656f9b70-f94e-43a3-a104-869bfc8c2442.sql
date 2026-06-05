
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'startup', 'company');
CREATE TYPE public.account_type AS ENUM ('startup', 'company');
CREATE TYPE public.pitch_type AS ENUM ('sell', 'investment', 'networking');
CREATE TYPE public.pitch_status AS ENUM ('open', 'closed', 'expired');
CREATE TYPE public.plan_tier AS ENUM ('basic', 'pro', 'elite');
CREATE TYPE public.payment_status AS ENUM ('pending', 'verified', 'none');
CREATE TYPE public.response_decision AS ENUM ('interested', 'declined');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  account_type public.account_type NOT NULL DEFAULT 'startup',
  company_name TEXT,
  industry TEXT,
  website TEXT,
  bio TEXT,
  plan public.plan_tier,
  payment_status public.payment_status NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _account_type public.account_type;
  _role public.app_role;
BEGIN
  _account_type := COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, 'startup');
  _role := CASE WHEN _account_type = 'company' THEN 'company'::public.app_role ELSE 'startup'::public.app_role END;

  INSERT INTO public.profiles (user_id, email, full_name, account_type, company_name, industry)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    _account_type,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'industry'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pitches
CREATE TABLE public.pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  pitch_type public.pitch_type NOT NULL,
  asking_amount NUMERIC,
  status public.pitch_status NOT NULL DEFAULT 'open',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pitches viewable by authenticated" ON public.pitches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Startups insert own pitches" ON public.pitches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = startup_id);
CREATE POLICY "Startups update own pitches" ON public.pitches
  FOR UPDATE TO authenticated USING (auth.uid() = startup_id);
CREATE POLICY "Startups delete own pitches" ON public.pitches
  FOR DELETE TO authenticated USING (auth.uid() = startup_id);

CREATE TRIGGER update_pitches_updated_at BEFORE UPDATE ON public.pitches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pitches_startup ON public.pitches(startup_id);
CREATE INDEX idx_pitches_status ON public.pitches(status);
CREATE INDEX idx_pitches_industry ON public.pitches(industry);

-- Responses
CREATE TABLE public.pitch_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID NOT NULL REFERENCES public.pitches(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  decision public.response_decision NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pitch_id, company_id)
);
ALTER TABLE public.pitch_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Responses viewable by participants" ON public.pitch_responses
  FOR SELECT TO authenticated USING (
    auth.uid() = company_id
    OR auth.uid() IN (SELECT startup_id FROM public.pitches WHERE id = pitch_id)
  );
CREATE POLICY "Companies insert own responses" ON public.pitch_responses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Companies update own responses" ON public.pitch_responses
  FOR UPDATE TO authenticated USING (auth.uid() = company_id);

CREATE INDEX idx_responses_pitch ON public.pitch_responses(pitch_id);
CREATE INDEX idx_responses_company ON public.pitch_responses(company_id);
