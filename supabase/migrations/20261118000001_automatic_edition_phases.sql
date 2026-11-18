-- Drive the Miss France 2027 edition phase from the Paris ceremony schedule.
-- The database clock evaluates timestamptz values, so the cron server timezone
-- does not affect the phase boundaries.

alter table public.editions
  add column if not exists ceremony_ends_at timestamptz;

update public.editions
set predictions_deadline = timestamptz '2026-12-12 00:00:00 Europe/Paris',
    ceremony_at = timestamptz '2026-12-12 21:10:00 Europe/Paris',
    ceremony_ends_at = timestamptz '2026-12-13 02:00:00 Europe/Paris'
where slug = 'miss-france-2027';

-- Manual phase and date changes are no longer exposed to application users.
revoke all on function public.admin_update_edition_timeline(uuid, text, timestamptz, timestamptz)
  from public, anon, authenticated;

create or replace function public.sync_edition_phase()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_count integer;
begin
  update public.editions as edition
  set status = case
        when now() >= edition.ceremony_ends_at then 'completed'
        when now() >= edition.ceremony_at then 'live'
        when now() >= edition.predictions_deadline then 'locked'
        else 'open'
      end
  where edition.slug = 'miss-france-2027'
    and edition.status <> 'draft'
    and edition.predictions_deadline is not null
    and edition.ceremony_at is not null
    and edition.ceremony_ends_at is not null
    and edition.status is distinct from case
        when now() >= edition.ceremony_ends_at then 'completed'
        when now() >= edition.ceremony_at then 'live'
        when now() >= edition.predictions_deadline then 'locked'
        else 'open'
      end;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;
revoke all on function public.sync_edition_phase() from public, anon, authenticated;

-- Supabase Cron runs in Postgres and checks the fixed schedule once per minute.
create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid)
from cron.job
where command = 'select public.sync_edition_phase()';

select cron.schedule(
  '* * * * *',
  'select public.sync_edition_phase()'
);

select public.sync_edition_phase();

-- A submitted ranking stays submitted, but its owner may revise it until the
-- prediction deadline. The status never drops back to draft.
create or replace function public.save_my_prediction(
  target_edition_slug text,
  candidate_slugs text[],
  submit_prediction boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_edition_id uuid;
  target_edition_status text;
  target_deadline timestamptz;
  saved_prediction_id uuid;
  saved_prediction_status text;
  requested_slugs text[] := coalesce(candidate_slugs, array[]::text[]);
  requested_count integer;
  distinct_count integer;
  valid_candidate_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select edition.id, edition.status, edition.predictions_deadline
    into target_edition_id, target_edition_status, target_deadline
    from public.editions as edition
    where edition.slug = target_edition_slug
    for share;
  if target_edition_id is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if target_edition_status <> 'open' or target_deadline is null or target_deadline <= now() then
    raise exception 'Predictions are not open for editing' using errcode = 'P0001';
  end if;
  if submit_prediction and cardinality(requested_slugs) <> 12 then
    raise exception 'A submitted prediction must contain exactly 12 candidates' using errcode = '23514';
  end if;
  if cardinality(requested_slugs) > 12 then
    raise exception 'A prediction cannot contain more than 12 candidates' using errcode = '23514';
  end if;

  select count(*), count(distinct requested.slug)
    into requested_count, distinct_count
    from unnest(requested_slugs) as requested(slug);
  if requested_count <> distinct_count then
    raise exception 'A candidate cannot appear more than once' using errcode = '23505';
  end if;
  select count(*) into valid_candidate_count
    from public.candidates as candidate
    join unnest(requested_slugs) as requested(slug) on requested.slug = candidate.slug
    where candidate.edition_id = target_edition_id;
  if valid_candidate_count <> requested_count then
    raise exception 'One or more candidates do not belong to this edition' using errcode = '23503';
  end if;

  insert into public.predictions (user_id, edition_id, status)
    values (current_user_id, target_edition_id, 'draft')
    on conflict (user_id, edition_id) do nothing
    returning id into saved_prediction_id;
  if saved_prediction_id is null then
    select prediction.id, prediction.status into saved_prediction_id, saved_prediction_status
      from public.predictions as prediction
      where prediction.user_id = current_user_id and prediction.edition_id = target_edition_id
      for update;
    if saved_prediction_status = 'submitted' and not submit_prediction then
      raise exception 'A submitted prediction must remain submitted while it is editable' using errcode = '55000';
    end if;
  end if;

  delete from public.prediction_choices as choice where choice.prediction_id = saved_prediction_id;
  insert into public.prediction_choices (prediction_id, edition_id, candidate_id, rank)
    select saved_prediction_id, target_edition_id, candidate.id, requested.ordinality::smallint
    from unnest(requested_slugs) with ordinality as requested(slug, ordinality)
    join public.candidates as candidate
      on candidate.slug = requested.slug and candidate.edition_id = target_edition_id;

  if submit_prediction then
    update public.predictions set status = 'submitted' where id = saved_prediction_id;
  else
    update public.predictions set updated_at = now() where id = saved_prediction_id;
  end if;
  return saved_prediction_id;
end;
$$;
revoke all on function public.save_my_prediction(text, text[], boolean) from public, anon;
grant execute on function public.save_my_prediction(text, text[], boolean) to authenticated;

drop policy if exists "owners edit choices during preparation or open window" on public.prediction_choices;
create policy "owners edit choices during preparation or open window" on public.prediction_choices
for insert to authenticated with check (
  exists (
    select 1 from public.predictions as prediction
    join public.editions as edition on edition.id = prediction.edition_id
    where prediction.id = prediction_id
      and prediction.user_id = auth.uid()
      and (
        (prediction.status = 'draft' and public.is_prediction_draft_available(prediction.edition_id))
        or (prediction.status = 'submitted' and edition.status = 'open' and edition.predictions_deadline > now())
      )
  )
);

drop policy if exists "owners update choices during preparation or open window" on public.prediction_choices;
create policy "owners update choices during preparation or open window" on public.prediction_choices
for update to authenticated using (
  exists (
    select 1 from public.predictions as prediction
    join public.editions as edition on edition.id = prediction.edition_id
    where prediction.id = prediction_id
      and prediction.user_id = auth.uid()
      and (
        (prediction.status = 'draft' and public.is_prediction_draft_available(prediction.edition_id))
        or (prediction.status = 'submitted' and edition.status = 'open' and edition.predictions_deadline > now())
      )
  )
) with check (
  exists (
    select 1 from public.predictions as prediction
    join public.editions as edition on edition.id = prediction.edition_id
    where prediction.id = prediction_id
      and prediction.user_id = auth.uid()
      and (
        (prediction.status = 'draft' and public.is_prediction_draft_available(prediction.edition_id))
        or (prediction.status = 'submitted' and edition.status = 'open' and edition.predictions_deadline > now())
      )
  )
);

drop policy if exists "owners delete choices during preparation or open window" on public.prediction_choices;
create policy "owners delete choices during preparation or open window" on public.prediction_choices
for delete to authenticated using (
  exists (
    select 1 from public.predictions as prediction
    join public.editions as edition on edition.id = prediction.edition_id
    where prediction.id = prediction_id
      and prediction.user_id = auth.uid()
      and (
        (prediction.status = 'draft' and public.is_prediction_draft_available(prediction.edition_id))
        or (prediction.status = 'submitted' and edition.status = 'open' and edition.predictions_deadline > now())
      )
  )
);

create or replace function public.set_my_prediction_favorite(
  target_edition_slug text,
  favorite_candidate_slug text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_edition_id uuid;
  requested_candidate_id uuid;
  saved_prediction_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select edition.id into target_edition_id from public.editions as edition where edition.slug = target_edition_slug;
  if target_edition_id is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if not public.is_prediction_draft_available(target_edition_id) then
    raise exception 'Favorite editing is not available for this edition' using errcode = 'P0001';
  end if;
  if favorite_candidate_slug is not null then
    select candidate.id into requested_candidate_id
      from public.candidates as candidate
      where candidate.edition_id = target_edition_id and candidate.slug = favorite_candidate_slug;
    if requested_candidate_id is null then
      raise exception 'Candidate not found in this edition' using errcode = '23503';
    end if;
  end if;

  insert into public.predictions (user_id, edition_id, status, favorite_candidate_id)
    values (current_user_id, target_edition_id, 'draft', requested_candidate_id)
    on conflict (user_id, edition_id) do update
      set favorite_candidate_id = excluded.favorite_candidate_id, updated_at = now()
      where public.is_prediction_draft_available(public.predictions.edition_id)
        and (
          public.predictions.status = 'draft'
          or (public.predictions.status = 'submitted' and exists (
            select 1 from public.editions as edition
            where edition.id = public.predictions.edition_id
              and edition.status = 'open' and edition.predictions_deadline > now()
          ))
        )
    returning id into saved_prediction_id;
  if saved_prediction_id is null then
    raise exception 'Favorite editing is not available for this edition' using errcode = 'P0001';
  end if;
  return saved_prediction_id;
end;
$$;
revoke all on function public.set_my_prediction_favorite(text, text) from public, anon;
grant execute on function public.set_my_prediction_favorite(text, text) to authenticated;

notify pgrst, 'reload schema';
