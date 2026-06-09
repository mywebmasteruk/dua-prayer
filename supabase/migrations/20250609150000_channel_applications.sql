-- Channel applications: extend categories for community channels + Fillout webhook review

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
    CREATE TYPE public.channel_type AS ENUM ('category', 'user');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_status') THEN
    CREATE TYPE public.channel_status AS ENUM ('approved', 'pending_review', 'rejected');
  END IF;
END
$$;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS channel_type public.channel_type NOT NULL DEFAULT 'category',
  ADD COLUMN IF NOT EXISTS status public.channel_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS application jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS categories_handle_unique_idx
  ON public.categories (lower(handle))
  WHERE handle IS NOT NULL AND handle <> '';

CREATE INDEX IF NOT EXISTS categories_pending_review_idx
  ON public.categories (created_at DESC)
  WHERE channel_type = 'user' AND status = 'pending_review';

-- Existing seeded topic channels are platform categories
UPDATE public.categories SET
  channel_type = 'category',
  status = 'approved',
  is_verified = true,
  verified_at = COALESCE(verified_at, updated_at, created_at, now()),
  updated_at = now()
WHERE channel_type = 'category'
  AND status = 'approved'
  AND is_verified = false;

COMMENT ON COLUMN public.categories.channel_type IS 'category = platform topic; user = community channel application';
COMMENT ON COLUMN public.categories.status IS 'approved = public; pending_review = awaiting admin; rejected = hidden';
COMMENT ON COLUMN public.categories.application IS 'Raw Fillout / in-app application payload (email, message, filloutSubmissionId)';

-- Public read: approved channels only (pending/rejected hidden from anon + members)
DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select ON public.categories
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

-- Applicants may view their own pending/rejected application row
DROP POLICY IF EXISTS categories_select_own_application ON public.categories;
CREATE POLICY categories_select_own_application ON public.categories
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() AND channel_type = 'user');

CREATE UNIQUE INDEX IF NOT EXISTS categories_one_pending_per_owner_idx
  ON public.categories (owner_id)
  WHERE status = 'pending_review' AND channel_type = 'user';

-- Signed-in users may submit one pending community channel application
DROP POLICY IF EXISTS categories_insert_user_application ON public.categories;
CREATE POLICY categories_insert_user_application ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    channel_type = 'user'
    AND status = 'pending_review'
    AND owner_id = auth.uid()
    AND is_active = false
    AND is_verified = false
  );
