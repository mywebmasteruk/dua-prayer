-- Private storage bucket for application form file uploads (channel logos,
-- registration documents, volunteer CVs, etc.).
--
-- The bucket is PRIVATE: no public RLS policies on storage.objects for it.
-- All access goes through the service-role admin client server-side:
--   • uploads use short-lived signed upload URLs minted by the server
--   • admin review reads use short-lived signed download URLs minted by the server
-- The browser never receives storage credentials.

insert into storage.buckets (id, name, public)
values ('application-uploads', 'application-uploads', false)
on conflict (id) do nothing;
