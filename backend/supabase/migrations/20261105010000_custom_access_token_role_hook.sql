CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  assigned_role text;
  claims jsonb;
  app_metadata jsonb;
BEGIN
  SELECT user_role.role::text
  INTO assigned_role
  FROM public.user_roles AS user_role
  WHERE user_role.user_id = (event->>'user_id')::uuid;

  claims := CASE
    WHEN jsonb_typeof(event->'claims') = 'object' THEN event->'claims'
    ELSE '{}'::jsonb
  END;
  app_metadata := CASE
    WHEN jsonb_typeof(claims->'app_metadata') = 'object' THEN claims->'app_metadata'
    ELSE '{}'::jsonb
  END;

  app_metadata := jsonb_set(
    app_metadata,
    '{user_role}',
    to_jsonb(COALESCE(assigned_role, 'USER')),
    true
  );
  claims := jsonb_set(claims, '{app_metadata}', app_metadata, true);

  RETURN jsonb_set(event, '{claims}', claims, true);
END;
$$;

REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_default_user_role() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER students_create_default_user_role
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.create_default_user_role();
