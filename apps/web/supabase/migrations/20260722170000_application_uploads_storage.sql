insert into storage.buckets (id, name, public)
values ('application-uploads', 'application-uploads', false)
on conflict (id) do nothing;
