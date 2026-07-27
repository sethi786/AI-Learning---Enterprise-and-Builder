-- Enums
CREATE TYPE public.app_role AS ENUM ('learner', 'reviewer', 'admin');
CREATE TYPE public.run_status AS ENUM ('in_progress', 'passed', 'failed', 'abandoned');
CREATE TYPE public.event_kind AS ENUM (
  'stage_enter','config_change','architecture_change','command','injection_fired',
  'diagnosis','containment','remediation','evaluation','artifact','sar_answer','decision','note'
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role_focus TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles (never on profiles table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-create profile + default learner role on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'learner');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Scenario runs
CREATE TABLE public.scenario_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  scenario_version TEXT NOT NULL DEFAULT 'v1',
  status public.run_status NOT NULL DEFAULT 'in_progress',
  current_stage TEXT,
  score NUMERIC,
  max_score NUMERIC,
  competencies JSONB NOT NULL DEFAULT '{}'::jsonb,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.scenario_runs TO authenticated;
GRANT ALL ON public.scenario_runs TO service_role;
ALTER TABLE public.scenario_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "runs_owner_select" ON public.scenario_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'reviewer') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "runs_owner_insert" ON public.scenario_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "runs_owner_update" ON public.scenario_runs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX runs_user_idx ON public.scenario_runs(user_id, started_at DESC);

-- Immutable audit log of everything that happens in a run
CREATE TABLE public.scenario_events (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.scenario_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.event_kind NOT NULL,
  stage TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.scenario_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.scenario_events_id_seq TO authenticated;
GRANT ALL ON public.scenario_events TO service_role;
GRANT ALL ON SEQUENCE public.scenario_events_id_seq TO service_role;
ALTER TABLE public.scenario_events ENABLE ROW LEVEL SECURITY;
-- Owners can read their own events; reviewers/admins read all; no updates/deletes from the app
CREATE POLICY "events_owner_select" ON public.scenario_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'reviewer') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "events_owner_insert" ON public.scenario_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.scenario_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));
-- Explicitly no UPDATE/DELETE policies -> append-only from the app

-- Policy decisions (promotion / go-no-go traces)
CREATE TABLE public.policy_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.scenario_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  decision TEXT NOT NULL,
  facts JSONB NOT NULL DEFAULT '{}'::jsonb,
  failed_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_remediation JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.policy_decisions TO authenticated;
GRANT ALL ON public.policy_decisions TO service_role;
ALTER TABLE public.policy_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decisions_owner_select" ON public.policy_decisions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'reviewer') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "decisions_owner_insert" ON public.policy_decisions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER runs_touch_updated BEFORE UPDATE ON public.scenario_runs
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER profiles_touch_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();