-- Admin-only transactional editor for official Top 12 results.
create or replace function public.admin_save_edition_results(
  target_edition_id uuid,
  ranked_candidate_ids uuid[],
  publish_results boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result_count integer;
  unique_candidate_count integer;
  valid_candidate_count integer;
  edition_status text;
  predictions_deadline timestamptz;
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if coalesce(array_length(ranked_candidate_ids, 1), 0) <> 12 then
    raise exception 'Exactly 12 ranked candidates are required' using errcode = '23514';
  end if;

  select status, editions.predictions_deadline into edition_status, predictions_deadline
    from public.editions where id = target_edition_id;
  if edition_status is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if publish_results and (
    edition_status not in ('live', 'completed')
    or predictions_deadline is null
    or predictions_deadline > now()
  ) then
    raise exception 'Results can only be published after the deadline while the edition is live or completed' using errcode = 'P0001';
  end if;

  select count(*), count(distinct candidate_id)
    into result_count, unique_candidate_count
    from unnest(ranked_candidate_ids) as ranked(candidate_id);
  if result_count <> 12 or unique_candidate_count <> 12 then
    raise exception 'The 12 ranked candidates must be different and valid' using errcode = '23514';
  end if;

  select count(*) into valid_candidate_count
    from public.candidates as candidate
    where candidate.edition_id = target_edition_id
      and candidate.id = any(ranked_candidate_ids);
  if valid_candidate_count <> 12 then
    raise exception 'Every ranked candidate must belong to the selected edition' using errcode = '23503';
  end if;

  delete from public.results where edition_id = target_edition_id;
  insert into public.results (edition_id, candidate_id, final_rank, published)
  select target_edition_id, ranked.candidate_id, ranked.ordinality::smallint, publish_results
    from unnest(ranked_candidate_ids) with ordinality as ranked(candidate_id, ordinality);

  delete from public.scores as score
    using public.predictions as prediction
    where score.prediction_id = prediction.id and prediction.edition_id = target_edition_id;

  return 12;
end;
$$;
revoke all on function public.admin_save_edition_results(uuid, uuid[], boolean) from public, anon;
grant execute on function public.admin_save_edition_results(uuid, uuid[], boolean) to authenticated;

-- No barème is embedded here: an administrator explicitly supplies all 12
-- values after the product owner approves the point system.
create or replace function public.admin_save_scoring_rules(
  target_edition_id uuid,
  points_by_rank integer[]
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  valid_point_count integer;
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.editions where id = target_edition_id) then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if coalesce(array_length(points_by_rank, 1), 0) <> 12 then
    raise exception 'Exactly 12 scoring values are required' using errcode = '23514';
  end if;

  select count(*) into valid_point_count
    from unnest(points_by_rank) as point_value(points)
    where points is not null and points >= 0;
  if valid_point_count <> 12 then
    raise exception 'Scoring values must be non-negative integers' using errcode = '23514';
  end if;

  delete from public.scoring_rules where edition_id = target_edition_id;
  insert into public.scoring_rules (edition_id, rank, points)
  select target_edition_id, configured.ordinality::smallint, configured.points
    from unnest(points_by_rank) with ordinality as configured(points, ordinality);

  delete from public.scores as score
    using public.predictions as prediction
    where score.prediction_id = prediction.id and prediction.edition_id = target_edition_id;

  return 12;
end;
$$;
revoke all on function public.admin_save_scoring_rules(uuid, integer[]) from public, anon;
grant execute on function public.admin_save_scoring_rules(uuid, integer[]) to authenticated;
notify pgrst, 'reload schema';
