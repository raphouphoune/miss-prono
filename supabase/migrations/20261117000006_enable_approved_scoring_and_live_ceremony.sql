-- Product owner approved this V1 scale: 100 for rank 1, 50 for ranks 2-5,
-- and 10 for ranks 6-12 (370 points maximum).
insert into public.scoring_rules (edition_id, rank, points)
select edition.id, configured.rank, configured.points
from public.editions as edition
cross join (values
  (1::smallint, 100),
  (2::smallint, 50),
  (3::smallint, 50),
  (4::smallint, 50),
  (5::smallint, 50),
  (6::smallint, 10),
  (7::smallint, 10),
  (8::smallint, 10),
  (9::smallint, 10),
  (10::smallint, 10),
  (11::smallint, 10),
  (12::smallint, 10)
) as configured(rank, points)
where edition.slug = 'miss-france-2027'
on conflict (edition_id, rank) do update set points = excluded.points;

-- All live announcements are authored and published by an administrator.
create or replace function public.admin_save_ceremony_event(
  target_edition_id uuid,
  target_event_id uuid,
  event_stage text,
  event_title text,
  event_body text,
  publish_event boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved_event_id uuid;
  edition_status text;
  normalized_title text := trim(event_title);
  normalized_body text := nullif(trim(event_body), '');
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if event_stage not in ('selection', 'semi_finalists', 'finalists', 'winner', 'custom') then
    raise exception 'Invalid ceremony stage' using errcode = '23514';
  end if;
  if char_length(normalized_title) not between 3 and 100 then
    raise exception 'Event title must contain between 3 and 100 characters' using errcode = '23514';
  end if;
  if normalized_body is not null and char_length(normalized_body) > 2000 then
    raise exception 'Event description cannot exceed 2000 characters' using errcode = '23514';
  end if;

  select status into edition_status from public.editions where id = target_edition_id;
  if edition_status is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if publish_event and edition_status not in ('live', 'completed') then
    raise exception 'Ceremony updates can only be published while the edition is live or completed' using errcode = 'P0001';
  end if;

  if target_event_id is null then
    insert into public.ceremony_events (edition_id, stage, title, body, status, published_at)
    values (
      target_edition_id, event_stage, normalized_title, normalized_body,
      case when publish_event then 'published' else 'draft' end,
      case when publish_event then now() else null end
    ) returning id into saved_event_id;
  else
    update public.ceremony_events as event
      set stage = event_stage,
          title = normalized_title,
          body = normalized_body,
          status = case when publish_event then 'published' else 'draft' end,
          published_at = case when publish_event then now() else null end
      where event.id = target_event_id and event.edition_id = target_edition_id
      returning event.id into saved_event_id;
    if saved_event_id is null then
      raise exception 'Ceremony event not found' using errcode = 'P0002';
    end if;
  end if;
  return saved_event_id;
end;
$$;
revoke all on function public.admin_save_ceremony_event(uuid, uuid, text, text, text, boolean) from public, anon;
grant execute on function public.admin_save_ceremony_event(uuid, uuid, text, text, text, boolean) to authenticated;

-- Enable Postgres Changes for the public live ceremony feed when the standard
-- Supabase Realtime publication exists in this project.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'ceremony_events'
     ) then
    alter publication supabase_realtime add table public.ceremony_events;
  end if;
end;
$$;
notify pgrst, 'reload schema';
