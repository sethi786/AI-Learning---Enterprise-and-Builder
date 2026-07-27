-- Cross-device learner progress.
--
-- Progress is authoritative in the browser (localStorage) so anonymous
-- practice keeps working exactly as before. This table is a mirror for
-- signed-in users: one row per learner holding the whole progress blob.
--
-- Stored as JSONB rather than normalised tables on purpose — the shape is
-- owned by `src/lib/progress.ts`, versioned by its own `schemaVersion`, and
-- is only ever read and written whole.

CREATE TABLE public.learner_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 2,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.learner_progress TO authenticated;
GRANT ALL ON public.learner_progress TO service_role;

ALTER TABLE public.learner_progress ENABLE ROW LEVEL SECURITY;

-- Owner-only, matching the policy shape used by scenario_runs.
CREATE POLICY "learner_progress_select_own" ON public.learner_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "learner_progress_insert_own" ON public.learner_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learner_progress_update_own" ON public.learner_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER learner_progress_touch_updated
  BEFORE UPDATE ON public.learner_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
