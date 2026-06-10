-- Prevent duplicate pending channel applications from double-submits.
-- submitChannelApplication checks-then-inserts; this closes the race window.
-- (Channels live in public.categories with channel_type = 'user'.)
CREATE UNIQUE INDEX IF NOT EXISTS categories_one_pending_application_per_owner
  ON public.categories (owner_id)
  WHERE status = 'pending_review' AND owner_id IS NOT NULL;
