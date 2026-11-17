-- Scores are recalculated from the published official results and the
-- administrator-configured scoring rules. No unapproved default barème is seeded.
create or replace function public.calculate_edition_scores(target_edition_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  calculated_count integer;
  edition_status text;
  predictions_deadline timestamptz;
  published_result_count integer;
  scoring_rule_count integer;
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select status, editions.predictions_deadline into edition_status, predictions_deadline
    from public.editions where id = target_edition_id;
  if edition_status is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if edition_status not in ('live', 'completed') then
    raise exception 'Scores can only be calculated after the edition goes live' using errcode = 'P0001';
  end if;
  if predictions_deadline is null or predictions_deadline > now() then
    raise exception 'The prediction deadline must have passed before scores are calculated' using errcode = 'P0001';
  end if;

  select count(*) into published_result_count
    from public.results
    where edition_id = target_edition_id and published;
  if published_result_count <> 12 then
    raise exception 'Exactly 12 published official results are required' using errcode = 'P0001';
  end if;

  select count(*) into scoring_rule_count
    from public.scoring_rules
    where edition_id = target_edition_id;
  if scoring_rule_count <> 12 then
    raise exception 'Exactly 12 scoring rules must be configured' using errcode = 'P0001';
  end if;

  insert into public.scores (prediction_id, total_points, exact_positions, calculated_at)
  select
    prediction.id,
    coalesce(sum(rule.points) filter (where result.final_rank = choice.rank), 0)::integer,
    count(*) filter (where result.final_rank = choice.rank)::smallint,
    now()
  from public.predictions as prediction
  left join public.prediction_choices as choice on choice.prediction_id = prediction.id
  left join public.results as result
    on result.edition_id = prediction.edition_id
    and result.candidate_id = choice.candidate_id
    and result.published
  left join public.scoring_rules as rule
    on rule.edition_id = prediction.edition_id and rule.rank = choice.rank
  where prediction.edition_id = target_edition_id and prediction.status = 'submitted'
  group by prediction.id
  on conflict (prediction_id) do update set
    total_points = excluded.total_points,
    exact_positions = excluded.exact_positions,
    calculated_at = now();

  get diagnostics calculated_count = row_count;

  delete from public.scores as score
  using public.predictions as prediction
  where score.prediction_id = prediction.id
    and prediction.edition_id = target_edition_id
    and prediction.status <> 'submitted';

  return calculated_count;
end;
$$;
revoke all on function public.calculate_edition_scores(uuid) from public, anon;
grant execute on function public.calculate_edition_scores(uuid) to authenticated;

-- Expose only public usernames and aggregate score fields after all 12 official
-- results have been published. The view contains no private profile fields.
create or replace view public.leaderboard as
select
  edition.slug as edition_slug,
  edition.year as edition_year,
  rank() over (partition by edition.id order by score.total_points desc, score.exact_positions desc) as player_rank,
  profile.username,
  score.total_points,
  score.exact_positions
from public.scores as score
join public.predictions as prediction on prediction.id = score.prediction_id and prediction.status = 'submitted'
join public.profiles as profile on profile.id = prediction.user_id
join public.editions as edition on edition.id = prediction.edition_id
where edition.status in ('live', 'completed')
  and edition.predictions_deadline is not null
  and edition.predictions_deadline <= now()
  and (
    select count(*) from public.results as result
    where result.edition_id = edition.id and result.published
  ) = 12;
grant select on public.leaderboard to anon, authenticated;
notify pgrst, 'reload schema';
