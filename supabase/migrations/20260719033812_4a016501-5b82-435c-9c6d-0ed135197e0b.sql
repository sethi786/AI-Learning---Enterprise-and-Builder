-- Pin search_path on the trigger function
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- handle_new_user is only invoked by the on_auth_user_created trigger; service_role is enough
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tg_touch_updated_at() TO authenticated, service_role;