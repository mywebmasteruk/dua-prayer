-- SECURITY: stop public exposure of community-channel applicant PII.
--
-- categories_select (20250609150000_channel_applications.sql) grants anon +
-- authenticated SELECT on every approved category row. RLS is row-level, not
-- column-level, so once a community channel is approved the row's `application`
-- jsonb — which holds applicantEmail, name, organization, registration number,
-- etc. (see lib/channel-applications.ts) — becomes readable by anyone holding
-- the public anon key:
--   GET /rest/v1/categories?status=eq.approved&select=application,owner_id
--
-- All legitimate reads of `application` go through server actions using the
-- service role (admin client), which is unaffected by column privileges. The
-- app's anon/authenticated queries select explicit column lists that never
-- include `application` (CATEGORY_SELECT in app/actions/duas.ts), so revoking
-- column-level SELECT here does not break any client read.

REVOKE SELECT (application) ON public.categories FROM anon;
REVOKE SELECT (application) ON public.categories FROM authenticated;
