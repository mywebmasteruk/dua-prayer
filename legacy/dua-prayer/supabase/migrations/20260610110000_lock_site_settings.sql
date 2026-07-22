-- SECURITY: site_settings stores Stripe secret keys (sk_live_..., whsec_...).
--
-- The site_settings_admin_all policy granted full read/write to any
-- authenticated user with profiles.is_admin = true. The app layer treats only
-- the founding admin as admin, but the DB policy trusted a broader set: any
-- stale is_admin = true row could read live Stripe secrets through PostgREST
-- with the public anon key.
--
-- All legitimate settings reads/writes go through server actions using the
-- service role, which bypasses RLS. Client-side access only needs the
-- whitelisted public keys covered by site_settings_public_select.

DROP POLICY IF EXISTS site_settings_admin_all ON public.site_settings;
