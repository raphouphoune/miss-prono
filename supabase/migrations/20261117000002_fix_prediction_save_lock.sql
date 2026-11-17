-- The save RPC runs as the authenticated user. Locking the edition row with
-- FOR SHARE also requires UPDATE-policy access and can hide the row from
-- ordinary users. The final submission trigger independently rechecks the
-- edition status and deadline, so a row lock here is unnecessary.
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
    where edition.slug = target_edition_slug;

  if target_edition_id is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;

  if submit_prediction then
    if target_edition_status <> 'open' or target_deadline is null or target_deadline <= now() then
      raise exception 'Predictions are not open for submission' using errcode = 'P0001';
    end if;
    if cardinality(requested_slugs) <> 12 then
      raise exception 'A submitted prediction must contain exactly 12 candidates' using errcode = '23514';
    end if;
  elsif not public.is_prediction_draft_available(target_edition_id) then
    raise exception 'Draft editing is not available for this edition' using errcode = 'P0001';
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
    select prediction.id, prediction.status
      into saved_prediction_id, saved_prediction_status
      from public.predictions as prediction
      where prediction.user_id = current_user_id and prediction.edition_id = target_edition_id
      for update;
    if saved_prediction_status = 'submitted' then
      raise exception 'This prediction has already been submitted' using errcode = '55000';
    end if;
  end if;

  delete from public.prediction_choices as choice
    where choice.prediction_id = saved_prediction_id;

  insert into public.prediction_choices (prediction_id, edition_id, candidate_id, rank)
  select saved_prediction_id, target_edition_id, candidate.id, requested.ordinality::smallint
    from unnest(requested_slugs) with ordinality as requested(slug, ordinality)
    join public.candidates as candidate
      on candidate.slug = requested.slug and candidate.edition_id = target_edition_id;

  if submit_prediction then
    update public.predictions as prediction
      set status = 'submitted'
      where prediction.id = saved_prediction_id;
  else
    update public.predictions as prediction
      set updated_at = now()
      where prediction.id = saved_prediction_id;
  end if;

  return saved_prediction_id;
end;
$$;
revoke all on function public.save_my_prediction(text, text[], boolean) from public, anon;
grant execute on function public.save_my_prediction(text, text[], boolean) to authenticated;
notify pgrst, 'reload schema';
