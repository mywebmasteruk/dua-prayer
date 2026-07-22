-- Volunteer registration: pending review workflow on profiles

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_type') THEN
    CREATE TYPE public.account_status_type AS ENUM ('active', 'pending_review', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role_type') THEN
    CREATE TYPE public.member_role_type AS ENUM ('volunteer', 'moderator', 'admin');
  END IF;
END
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status_type NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS member_role public.member_role_type,
  ADD COLUMN IF NOT EXISTS volunteer_application jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_pending_review_idx
  ON public.profiles (created_at DESC)
  WHERE account_status = 'pending_review';

COMMENT ON COLUMN public.profiles.account_status IS 'active = full access; pending_review = volunteer awaiting admin; rejected = denied';
COMMENT ON COLUMN public.profiles.member_role IS 'Assigned on activation: volunteer, moderator, or admin';
COMMENT ON COLUMN public.profiles.volunteer_application IS 'Raw application payload (skills, message, timezone, source)';

-- Honor app_metadata.account_status on signup (set by service-role user creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.account_status_type := 'active';
  v_display_name text;
  v_application jsonb;
BEGIN
  IF NEW.raw_app_meta_data ? 'account_status' THEN
    BEGIN
      v_status := (NEW.raw_app_meta_data->>'account_status')::public.account_status_type;
    EXCEPTION WHEN OTHERS THEN
      v_status := 'active';
    END;
  END IF;

  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_app_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  IF NEW.raw_app_meta_data ? 'volunteer_application' THEN
    v_application := NEW.raw_app_meta_data->'volunteer_application';
  END IF;

  INSERT INTO public.profiles (id, display_name, account_status, volunteer_application)
  VALUES (NEW.id, v_display_name, v_status, v_application)
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    account_status = EXCLUDED.account_status,
    volunteer_application = COALESCE(EXCLUDED.volunteer_application, public.profiles.volunteer_application),
    updated_at = now();

  RETURN NEW;
END;
$$;
