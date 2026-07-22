-- Separate a dua's "space" (channel) from its "topic" (category).
-- category_id stays the topic; channel_id is the optional community channel
-- the dua was posted into. Channels remain channel_type='user' rows in
-- categories, so channel_id also references categories(id).
alter table public.duas
  add column if not exists channel_id bigint references public.categories(id) on delete set null;

create index if not exists duas_channel_id_idx on public.duas(channel_id);

-- Backfill: any dua whose category currently points at a community channel
-- was really posted into that channel. Move it to channel_id and clear the
-- topic (an admin/owner can set a real topic later).
update public.duas d
set channel_id = d.category_id,
    category_id = null
from public.categories c
where d.category_id = c.id
  and c.channel_type = 'user';
