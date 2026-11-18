-- Live ceremony relay: delegated announcers, progressive scoring, league-only
-- pick reveals, reactions, and an auditable correction trail.

create table public.ceremony_announcers (
  edition_id uuid not null references public.editions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (edition_id, user_id)
);

alter table public.ceremony_events
  add column candidate_id uuid,
  add column official_rank smallint,
  add column created_by uuid references public.profiles(id) on delete set null,
  add column retracted_at timestamptz,
  add column retracted_by uuid references public.profiles(id) on delete set null;

alter table public.ceremony_events
  add constraint ceremony_events_candidate_edition_fkey
    foreign key (candidate_id, edition_id) references public.candidates(id, edition_id) on delete restrict,
  add constraint ceremony_events_official_rank_check
    check (official_rank is null or official_rank between 1 and 5);

alter table public.ceremony_events drop constraint if exists ceremony_events_stage_check;
alter table public.ceremony_events drop constraint if exists ceremony_events_status_check;
alter table public.ceremony_events drop constraint if exists ceremony_events_check;
alter table public.ceremony_events
  add constraint ceremony_events_stage_check
    check (stage in ('selection', 'semi_finalists', 'finalists', 'winner', 'placement', 'custom')),
  add constraint ceremony_events_status_check
    check (status in ('draft', 'published', 'retracted')),
  add constraint ceremony_events_publish_state_check
    check (
      (status = 'draft' and published_at is null and retracted_at is null)
      or (status = 'published' and published_at is not null and retracted_at is null)
      or (status = 'retracted' and published_at is not null and retracted_at is not null)
    );

create unique index ceremony_events_candidate_stage_published_idx
  on public.ceremony_events (edition_id, candidate_id, stage)
  where status = 'published' and candidate_id is not null;
create unique index ceremony_events_published_rank_idx
  on public.ceremony_events (edition_id, official_rank)
  where status = 'published' and official_rank is not null;
create index ceremony_events_announced_candidate_idx
  on public.ceremony_events (edition_id, candidate_id, published_at)
  where status = 'published' and candidate_id is not null;

create table public.ceremony_event_revisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ceremony_events(id) on delete restrict,
  edition_id uuid not null references public.editions(id) on delete cascade,
  action text not null check (action in ('published', 'retracted')),
  changed_by uuid references public.profiles(id) on delete set null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index ceremony_event_revisions_edition_idx
  on public.ceremony_event_revisions (edition_id, created_at desc);

create table public.league_event_reactions (
  league_id uuid not null references public.leagues(id) on delete cascade,
  event_id uuid not null references public.ceremony_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('👏', '🔥', '👑')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, event_id, user_id)
);
create index league_event_reactions_event_idx
  on public.league_event_reactions (league_id, event_id, reaction);
create trigger league_event_reactions_set_updated_at before update on public.league_event_reactions
for each row execute function public.set_updated_at();

alter table public.scores
  add column top12_hits smallint not null default 0 check (top12_hits between 0 and 12),
  add column is_provisional boolean not null default true;

alter table public.ceremony_announcers enable row level security;
alter table public.ceremony_event_revisions enable row level security;
alter table public.league_event_reactions enable row level security;

create or replace function public.is_ceremony_announcer(target_edition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_app_admin() or exists (
    select 1 from public.ceremony_announcers as announcer
    where announcer.edition_id = target_edition_id and announcer.user_id = auth.uid()
  );
$$;
revoke all on function public.is_ceremony_announcer(uuid) from public, anon;
grant execute on function public.is_ceremony_announcer(uuid) to authenticated;

create policy "admins and assigned announcers read relay assignments" on public.ceremony_announcers
for select to authenticated using (public.is_app_admin() or user_id = auth.uid());
create policy "admins read ceremony revision history" on public.ceremony_event_revisions
for select to authenticated using (public.is_ceremony_announcer(edition_id));
create policy "league members read event reactions" on public.league_event_reactions
for select to authenticated using (public.is_league_member(league_id) or public.is_app_admin());
create policy "league members add own event reactions" on public.league_event_reactions
for insert to authenticated with check (
  user_id = auth.uid()
  and public.is_league_member(league_id)
  and exists (
    select 1 from public.ceremony_events as event
    join public.leagues as league on league.id = league_id
    where event.id = event_id and event.edition_id = league.edition_id
      and event.status = 'published'
  )
);
create policy "league members update own event reactions" on public.league_event_reactions
for update to authenticated using (user_id = auth.uid() and public.is_league_member(league_id))
with check (
  user_id = auth.uid()
  and public.is_league_member(league_id)
  and exists (
    select 1 from public.ceremony_events as event
    join public.leagues as league on league.id = league_id
    where event.id = event_id and event.edition_id = league.edition_id
      and event.status = 'published'
  )
);
create policy "league members delete own event reactions" on public.league_event_reactions
for delete to authenticated using (user_id = auth.uid() and public.is_league_member(league_id));

grant select on public.ceremony_announcers, public.ceremony_event_revisions, public.league_event_reactions to authenticated;
grant insert, update, delete on public.league_event_reactions to authenticated;

-- Submitted rankings are private by default. League reveals are served through
-- the narrowly scoped RPC below; global pages only receive aggregate scores.
drop policy if exists "users and post-deadline participants read predictions" on public.predictions;
drop policy if exists "predictions are private to their owner" on public.predictions;
create policy "predictions are private to their owner" on public.predictions
for select to authenticated using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists "choices follow prediction visibility" on public.prediction_choices;
drop policy if exists "choices are private to their owner" on public.prediction_choices;
create policy "choices are private to their owner" on public.prediction_choices
for select to authenticated using (
  public.is_app_admin() or exists (
    select 1 from public.predictions as prediction
    where prediction.id = prediction_id and prediction.user_id = auth.uid()
  )
);

drop policy if exists "published scores are readable" on public.scores;
drop policy if exists "scores are private to their owner" on public.scores;
create policy "scores are private to their owner" on public.scores
for select to authenticated using (
  public.is_app_admin() or exists (
    select 1 from public.predictions as prediction
    where prediction.id = prediction_id and prediction.user_id = auth.uid()
  )
);

create or replace function public.admin_set_ceremony_announcer(
  target_edition_id uuid,
  target_user_id uuid,
  allow_announcement boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.editions where id = target_edition_id) then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  if allow_announcement then
    insert into public.ceremony_announcers (edition_id, user_id, granted_by)
      values (target_edition_id, target_user_id, auth.uid())
      on conflict (edition_id, user_id) do update set granted_by = excluded.granted_by;
  else
    delete from public.ceremony_announcers
      where edition_id = target_edition_id and user_id = target_user_id;
  end if;
end;
$$;
revoke all on function public.admin_set_ceremony_announcer(uuid, uuid, boolean) from public, anon;
grant execute on function public.admin_set_ceremony_announcer(uuid, uuid, boolean) to authenticated;

create or replace function public.recalculate_live_scores(target_edition_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_count integer;
  top12_points integer;
  announced_top12_count integer;
  confirmed_top5_count integer;
begin
  select points into top12_points from public.scoring_rules
    where edition_id = target_edition_id and rank = 6;
  if top12_points is null then
    raise exception 'Top 12 scoring rule is missing' using errcode = 'P0001';
  end if;

  select count(*) into announced_top12_count from public.ceremony_events
    where edition_id = target_edition_id and stage = 'semi_finalists'
      and status = 'published' and candidate_id is not null;
  select count(*) into confirmed_top5_count from public.results
    where edition_id = target_edition_id and published and final_rank between 1 and 5;

  insert into public.scores (prediction_id, total_points, exact_positions, top12_hits, is_provisional, calculated_at)
  select
    prediction.id,
    (
      count(distinct choice.candidate_id) filter (where top12.candidate_id is not null) * top12_points
      + coalesce(sum(rule.points) filter (
        where result.final_rank = choice.rank and choice.rank between 1 and 5
      ), 0)
    )::integer as total_points,
    count(*) filter (where result.final_rank = choice.rank and choice.rank between 1 and 5)::smallint as exact_positions,
    count(distinct choice.candidate_id) filter (where top12.candidate_id is not null)::smallint as top12_hits,
    not (announced_top12_count = 12 and confirmed_top5_count = 5) as is_provisional,
    now()
  from public.predictions as prediction
  left join public.prediction_choices as choice on choice.prediction_id = prediction.id
  left join public.ceremony_events as top12
    on top12.edition_id = prediction.edition_id
    and top12.candidate_id = choice.candidate_id
    and top12.stage = 'semi_finalists'
    and top12.status = 'published'
  left join public.results as result
    on result.edition_id = prediction.edition_id
    and result.candidate_id = choice.candidate_id
    and result.published and result.final_rank between 1 and 5
  left join public.scoring_rules as rule
    on rule.edition_id = prediction.edition_id and rule.rank = choice.rank
  where prediction.edition_id = target_edition_id and prediction.status = 'submitted'
  group by prediction.id
  on conflict (prediction_id) do update set
    total_points = excluded.total_points,
    exact_positions = excluded.exact_positions,
    top12_hits = excluded.top12_hits,
    is_provisional = excluded.is_provisional,
    calculated_at = now();

  get diagnostics changed_count = row_count;
  delete from public.scores as score
    using public.predictions as prediction
    where score.prediction_id = prediction.id
      and prediction.edition_id = target_edition_id
      and prediction.status <> 'submitted';
  return changed_count;
end;
$$;
revoke all on function public.recalculate_live_scores(uuid) from public, anon, authenticated;

create or replace function public.announcer_publish_candidate(
  target_edition_id uuid,
  target_candidate_id uuid,
  announcement_type text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  edition_year integer;
  edition_status text;
  predictions_deadline timestamptz;
  candidate_name text;
  candidate_region text;
  event_stage text;
  event_title text;
  event_body text;
  saved_event_id uuid;
  top12_count integer;
  finalists_count integer;
  announced_rank smallint;
begin
  if current_user_id is null or not public.is_ceremony_announcer(target_edition_id) then
    raise exception 'Ceremony announcer access required' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_edition_id::text, 0));
  select year, status, editions.predictions_deadline
    into edition_year, edition_status, predictions_deadline
    from public.editions where id = target_edition_id;
  if edition_year is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if edition_status <> 'live' or predictions_deadline is null or predictions_deadline > now() then
    raise exception 'Announcements are available only during the live ceremony after prediction closure' using errcode = 'P0001';
  end if;
  select name, region into candidate_name, candidate_region
    from public.candidates where id = target_candidate_id and edition_id = target_edition_id;
  if candidate_name is null then
    raise exception 'Candidate not found in this edition' using errcode = '23503';
  end if;

  select count(*) into top12_count from public.ceremony_events
    where edition_id = target_edition_id and stage = 'semi_finalists'
      and status = 'published' and candidate_id is not null;
  select count(*) into finalists_count from public.ceremony_events
    where edition_id = target_edition_id and stage = 'finalists'
      and status = 'published' and candidate_id is not null;

  if announcement_type = 'semi_finalists' then
    if top12_count >= 12 then
      raise exception 'The Top 12 already contains 12 candidates' using errcode = '23505';
    end if;
    event_stage := 'semi_finalists';
    event_title := candidate_name || ' rejoint le Top 12';
    event_body := 'Miss ' || candidate_region || ' est annoncée parmi les 12 demi-finalistes de Miss France ' || edition_year || '.';
  elsif announcement_type = 'finalists' then
    if top12_count <> 12 then
      raise exception 'Announce all 12 semi-finalists before the five finalists' using errcode = 'P0001';
    end if;
    if finalists_count >= 5 then
      raise exception 'The five finalists have already been announced' using errcode = '23505';
    end if;
    if not exists (
      select 1 from public.ceremony_events
      where edition_id = target_edition_id and candidate_id = target_candidate_id
        and stage = 'semi_finalists' and status = 'published'
    ) then
      raise exception 'A finalist must belong to the announced Top 12' using errcode = '23503';
    end if;
    event_stage := 'finalists';
    event_title := candidate_name || ' rejoint les cinq finalistes';
    event_body := 'Miss ' || candidate_region || ' fait partie des cinq dernières candidates en lice pour Miss France ' || edition_year || '.';
  elsif announcement_type = 'placement' then
    if finalists_count <> 5 then
      raise exception 'Announce the five finalists before their official places' using errcode = 'P0001';
    end if;
    select (5 - count(*))::smallint into announced_rank
      from public.results
      where edition_id = target_edition_id and published and final_rank between 1 and 5;
    if announced_rank < 1 then
      raise exception 'All five finalist places have already been announced' using errcode = '23505';
    end if;
    if not exists (
      select 1 from public.ceremony_events
      where edition_id = target_edition_id and candidate_id = target_candidate_id
        and stage = 'finalists' and status = 'published'
    ) then
      raise exception 'A placed candidate must belong to the five finalists' using errcode = '23503';
    end if;
    if announced_rank = 1 then
      event_stage := 'winner';
      event_title := candidate_name || ' est Miss France ' || edition_year || ' !';
      event_body := 'Miss ' || candidate_region || ' remporte le titre de Miss France ' || edition_year || '.';
    else
      event_stage := 'placement';
      event_title := candidate_name || ' est ' || case announced_rank
        when 2 then 'première dauphine'
        when 3 then 'deuxième dauphine'
        when 4 then 'troisième dauphine'
        else 'quatrième dauphine'
      end;
      event_body := 'Miss ' || candidate_region || ' termine à la place ' || announced_rank || ' de Miss France ' || edition_year || '.';
    end if;
    -- A draft entered before the ceremony must not block a live placement.
    delete from public.results where edition_id = target_edition_id and not published;
    insert into public.results (edition_id, candidate_id, final_rank, published)
      values (target_edition_id, target_candidate_id, announced_rank, true);
  else
    raise exception 'Invalid announcement type' using errcode = '23514';
  end if;

  insert into public.ceremony_events (
    edition_id, stage, title, body, status, published_at, candidate_id, official_rank, created_by
  ) values (
    target_edition_id, event_stage, event_title, event_body, 'published', now(),
    target_candidate_id, announced_rank, current_user_id
  ) returning id into saved_event_id;

  insert into public.ceremony_event_revisions (event_id, edition_id, action, changed_by, snapshot)
    values (
      saved_event_id, target_edition_id, 'published', current_user_id,
      jsonb_build_object(
        'stage', event_stage, 'title', event_title, 'body', event_body,
        'candidate_id', target_candidate_id, 'official_rank', announced_rank
      )
    );

  perform public.recalculate_live_scores(target_edition_id);
  return saved_event_id;
end;
$$;
revoke all on function public.announcer_publish_candidate(uuid, uuid, text) from public, anon;
grant execute on function public.announcer_publish_candidate(uuid, uuid, text) to authenticated;

create or replace function public.announcer_retract_latest_candidate_event(
  target_edition_id uuid,
  target_event_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  target_event public.ceremony_events%rowtype;
  latest_event_id uuid;
begin
  if current_user_id is null or not public.is_ceremony_announcer(target_edition_id) then
    raise exception 'Ceremony announcer access required' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_edition_id::text, 0));
  select * into target_event from public.ceremony_events
    where id = target_event_id and edition_id = target_edition_id
      and status = 'published' and candidate_id is not null
    for update;
  if not found then
    raise exception 'Published candidate announcement not found' using errcode = 'P0002';
  end if;
  select id into latest_event_id from public.ceremony_events
    where edition_id = target_edition_id and status = 'published' and candidate_id is not null
    order by published_at desc, id desc limit 1;
  if latest_event_id <> target_event_id then
    raise exception 'Only the latest candidate announcement can be undone' using errcode = 'P0001';
  end if;

  insert into public.ceremony_event_revisions (event_id, edition_id, action, changed_by, snapshot)
    values (
      target_event.id, target_edition_id, 'retracted', current_user_id,
      jsonb_build_object(
        'stage', target_event.stage, 'title', target_event.title, 'body', target_event.body,
        'candidate_id', target_event.candidate_id, 'official_rank', target_event.official_rank,
        'published_at', target_event.published_at
      )
    );

  update public.ceremony_events
    set status = 'retracted', retracted_at = now(), retracted_by = current_user_id
    where id = target_event.id;
  insert into public.ceremony_events (edition_id, stage, title, body, status, published_at, created_by)
    values (
      target_edition_id, 'custom', 'Correction d’une annonce',
      'L’annonce « ' || target_event.title || ' » a été annulée. Les points et les classements ont été recalculés.',
      'published', now(), current_user_id
    );
  if target_event.official_rank is not null then
    delete from public.results where edition_id = target_edition_id
      and candidate_id = target_event.candidate_id and final_rank = target_event.official_rank;
  end if;
  perform public.recalculate_live_scores(target_edition_id);
end;
$$;
revoke all on function public.announcer_retract_latest_candidate_event(uuid, uuid) from public, anon;
grant execute on function public.announcer_retract_latest_candidate_event(uuid, uuid) to authenticated;

create or replace function public.get_league_live_picks(target_league_id uuid)
returns table (
  event_id uuid,
  candidate_id uuid,
  candidate_name text,
  candidate_region text,
  announced_at timestamptz,
  username text,
  has_prediction boolean,
  predicted_rank smallint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  target_edition_id uuid;
  target_status text;
  target_deadline timestamptz;
begin
  if auth.uid() is null or not public.is_league_member(target_league_id) then
    raise exception 'League membership required' using errcode = '42501';
  end if;
  select league.edition_id, edition.status, edition.predictions_deadline
    into target_edition_id, target_status, target_deadline
    from public.leagues as league
    join public.editions as edition on edition.id = league.edition_id
    where league.id = target_league_id;
  if target_edition_id is null or target_status not in ('live', 'completed')
     or target_deadline is null or target_deadline > now() then
    raise exception 'League picks are not available yet' using errcode = 'P0001';
  end if;

  return query
    select event.id, candidate.id, candidate.name, candidate.region, event.published_at,
      profile.username, prediction.id is not null, choice.rank
    from public.ceremony_events as event
    join public.candidates as candidate on candidate.id = event.candidate_id
    cross join public.league_members as member
    join public.profiles as profile on profile.id = member.user_id
    left join public.predictions as prediction
      on prediction.edition_id = target_edition_id
      and prediction.user_id = member.user_id and prediction.status = 'submitted'
    left join public.prediction_choices as choice
      on choice.prediction_id = prediction.id and choice.candidate_id = candidate.id
    where event.edition_id = target_edition_id and event.status = 'published'
      and event.candidate_id is not null and member.league_id = target_league_id
    order by event.published_at asc, member.joined_at asc;
end;
$$;
revoke all on function public.get_league_live_picks(uuid) from public, anon;
grant execute on function public.get_league_live_picks(uuid) to authenticated;

create or replace function public.get_league_standings(target_league_id uuid)
returns table (
  user_id uuid,
  username text,
  joined_at timestamptz,
  has_prediction boolean,
  total_points integer,
  exact_positions smallint,
  top12_hits smallint,
  is_provisional boolean,
  player_rank bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_league_member(target_league_id) then
    raise exception 'League membership required' using errcode = '42501';
  end if;
  return query
    select member.user_id, profile.username, member.joined_at,
      prediction.id is not null, score.total_points, score.exact_positions,
      score.top12_hits, score.is_provisional,
      rank() over (order by score.total_points desc nulls last,
        score.exact_positions desc nulls last, score.top12_hits desc nulls last, member.joined_at asc)
    from public.league_members as member
    join public.leagues as league on league.id = member.league_id
    join public.profiles as profile on profile.id = member.user_id
    left join public.predictions as prediction
      on prediction.user_id = member.user_id and prediction.edition_id = league.edition_id
      and prediction.status = 'submitted'
    left join public.scores as score on score.prediction_id = prediction.id
    where member.league_id = target_league_id
    order by score.total_points desc nulls last, score.exact_positions desc nulls last,
      score.top12_hits desc nulls last, member.joined_at asc;
end;
$$;
revoke all on function public.get_league_standings(uuid) from public, anon;
grant execute on function public.get_league_standings(uuid) to authenticated;

create or replace function public.set_league_event_reaction(
  target_league_id uuid,
  target_event_id uuid,
  requested_reaction text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_reaction text;
begin
  if current_user_id is null or not public.is_league_member(target_league_id) then
    raise exception 'League membership required' using errcode = '42501';
  end if;
  if requested_reaction not in ('👏', '🔥', '👑') then
    raise exception 'Invalid reaction' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.ceremony_events as event
    join public.leagues as league on league.id = target_league_id
    where event.id = target_event_id and event.edition_id = league.edition_id
      and event.status = 'published'
  ) then
    raise exception 'Published league event not found' using errcode = 'P0002';
  end if;

  select reaction into current_reaction from public.league_event_reactions
    where league_id = target_league_id and event_id = target_event_id and user_id = current_user_id;
  if current_reaction = requested_reaction then
    delete from public.league_event_reactions
      where league_id = target_league_id and event_id = target_event_id and user_id = current_user_id;
  else
    insert into public.league_event_reactions (league_id, event_id, user_id, reaction)
      values (target_league_id, target_event_id, current_user_id, requested_reaction)
      on conflict (league_id, event_id, user_id)
      do update set reaction = excluded.reaction, updated_at = now();
  end if;
end;
$$;
revoke all on function public.set_league_event_reaction(uuid, uuid, text) from public, anon;
grant execute on function public.set_league_event_reaction(uuid, uuid, text) to authenticated;

-- Keep ranks 1-5 as exact-place scoring. Ranks 6-12 share one Top 12
-- membership value because the 12 semi-finalists are announced in random order.
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
  valid_count integer;
  top12_value integer;
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
  select count(*) into valid_count from unnest(points_by_rank) as item(points)
    where item.points is not null and item.points >= 0;
  if valid_count <> 12 then
    raise exception 'Scoring values must be non-negative integers' using errcode = '23514';
  end if;
  select points_by_rank[6] into top12_value;
  if exists (
    select 1 from unnest(points_by_rank[6:12]) as item(points)
    where item.points <> top12_value
  ) then
    raise exception 'Top 12 membership points must be identical for ranks 6 to 12' using errcode = '23514';
  end if;
  delete from public.scoring_rules where edition_id = target_edition_id;
  insert into public.scoring_rules (edition_id, rank, points)
    select target_edition_id, item.ordinality::smallint, item.points
    from unnest(points_by_rank) with ordinality as item(points, ordinality);
  delete from public.scores as score using public.predictions as prediction
    where score.prediction_id = prediction.id and prediction.edition_id = target_edition_id;
  if exists (
    select 1 from public.editions where id = target_edition_id and status in ('live', 'completed')
  ) then
    perform public.recalculate_live_scores(target_edition_id);
  end if;
  return 12;
end;
$$;
revoke all on function public.admin_save_scoring_rules(uuid, integer[]) from public, anon;
grant execute on function public.admin_save_scoring_rules(uuid, integer[]) to authenticated;

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
  candidate_count integer;
  unique_count integer;
  valid_count integer;
  edition_status text;
  predictions_deadline timestamptz;
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if coalesce(array_length(ranked_candidate_ids, 1), 0) <> 5 then
    raise exception 'Exactly five ranked finalists are required' using errcode = '23514';
  end if;
  select status, editions.predictions_deadline into edition_status, predictions_deadline
    from public.editions where id = target_edition_id;
  if edition_status is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if publish_results and (
    edition_status not in ('live', 'completed') or predictions_deadline is null or predictions_deadline > now()
  ) then
    raise exception 'Results can only be published after the deadline while the edition is live or completed' using errcode = 'P0001';
  end if;
  select count(*), count(distinct candidate_id) into candidate_count, unique_count
    from unnest(ranked_candidate_ids) as ranked(candidate_id);
  if candidate_count <> 5 or unique_count <> 5 then
    raise exception 'The five ranked finalists must be different' using errcode = '23514';
  end if;
  select count(*) into valid_count from public.candidates as candidate
    where candidate.edition_id = target_edition_id and candidate.id = any(ranked_candidate_ids);
  if valid_count <> 5 then
    raise exception 'Every finalist must belong to the selected edition' using errcode = '23503';
  end if;
  if publish_results and (
    select count(*) from public.ceremony_events where edition_id = target_edition_id
      and stage = 'semi_finalists' and status = 'published' and candidate_id is not null
  ) <> 12 then
    raise exception 'Publish the 12 semi-finalists before the final results' using errcode = 'P0001';
  end if;
  if publish_results and (
    select count(*) from public.ceremony_events where edition_id = target_edition_id
      and stage = 'finalists' and status = 'published' and candidate_id is not null
  ) <> 5 then
    raise exception 'Publish the five finalists before the final results' using errcode = 'P0001';
  end if;
  if publish_results and exists (
    select 1 from unnest(ranked_candidate_ids) as ranked(candidate_id)
    where not exists (
      select 1 from public.ceremony_events as event
      where event.edition_id = target_edition_id and event.candidate_id = ranked.candidate_id
        and event.stage = 'finalists' and event.status = 'published'
    )
  ) then
    raise exception 'Official places must be selected from the five announced finalists' using errcode = '23503';
  end if;

  delete from public.results where edition_id = target_edition_id;
  insert into public.results (edition_id, candidate_id, final_rank, published)
    select target_edition_id, ranked.candidate_id, ranked.ordinality::smallint, publish_results
    from unnest(ranked_candidate_ids) with ordinality as ranked(candidate_id, ordinality);
  delete from public.scores as score using public.predictions as prediction
    where score.prediction_id = prediction.id and prediction.edition_id = target_edition_id;
  if publish_results then perform public.recalculate_live_scores(target_edition_id); end if;
  return 5;
end;
$$;
revoke all on function public.admin_save_edition_results(uuid, uuid[], boolean) from public, anon;
grant execute on function public.admin_save_edition_results(uuid, uuid[], boolean) to authenticated;

create or replace function public.calculate_edition_scores(target_edition_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  edition_status text;
  predictions_deadline timestamptz;
  top12_count integer;
  top5_count integer;
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  select status, editions.predictions_deadline into edition_status, predictions_deadline
    from public.editions where id = target_edition_id;
  if edition_status is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
  if edition_status not in ('live', 'completed') or predictions_deadline is null or predictions_deadline > now() then
    raise exception 'Scores can only be calculated during or after the live edition once predictions have closed' using errcode = 'P0001';
  end if;
  select count(*) into top12_count from public.ceremony_events
    where edition_id = target_edition_id and stage = 'semi_finalists'
      and status = 'published' and candidate_id is not null;
  select count(*) into top5_count from public.results
    where edition_id = target_edition_id and published and final_rank between 1 and 5;
  if top12_count <> 12 or top5_count <> 5 then
    raise exception 'Twelve semi-finalists and five official finalist places are required' using errcode = 'P0001';
  end if;
  return public.recalculate_live_scores(target_edition_id);
end;
$$;
revoke all on function public.calculate_edition_scores(uuid) from public, anon;
grant execute on function public.calculate_edition_scores(uuid) to authenticated;

create or replace function public.admin_update_edition_timeline(
  target_edition_id uuid,
  target_status text,
  target_predictions_deadline timestamptz,
  target_ceremony_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  top12_count integer;
  top5_count integer;
begin
  if auth.uid() is null or not public.is_app_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if target_status not in ('upcoming', 'open', 'locked', 'live', 'completed') then
    raise exception 'Invalid edition status' using errcode = '23514';
  end if;
  if target_status = 'upcoming' and target_predictions_deadline is not null and target_predictions_deadline <= now() then
    raise exception 'An upcoming edition must have a future deadline or no deadline' using errcode = '23514';
  end if;
  if target_status = 'open' and (target_predictions_deadline is null or target_predictions_deadline <= now()) then
    raise exception 'An open edition must have a future prediction deadline' using errcode = '23514';
  end if;
  if target_status in ('locked', 'live', 'completed') and (target_predictions_deadline is null or target_predictions_deadline > now()) then
    raise exception 'This edition phase requires a passed prediction deadline' using errcode = '23514';
  end if;
  if target_status = 'completed' then
    select count(*) into top12_count from public.ceremony_events where edition_id = target_edition_id
      and stage = 'semi_finalists' and status = 'published' and candidate_id is not null;
    select count(*) into top5_count from public.results where edition_id = target_edition_id
      and published and final_rank between 1 and 5;
    if top12_count <> 12 or top5_count <> 5 then
      raise exception 'Publish all 12 semi-finalists and five official places before completing the edition' using errcode = '23514';
    end if;
  end if;
  update public.editions set status = target_status,
      predictions_deadline = target_predictions_deadline, ceremony_at = target_ceremony_at
    where id = target_edition_id;
  if not found then raise exception 'Edition not found' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.admin_update_edition_timeline(uuid, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_update_edition_timeline(uuid, text, timestamptz, timestamptz) to authenticated;

create or replace view public.leaderboard as
select
  edition.slug as edition_slug,
  edition.year as edition_year,
  rank() over (
    partition by edition.id
    order by score.total_points desc, score.exact_positions desc, score.top12_hits desc
  ) as player_rank,
  profile.username,
  score.total_points,
  score.exact_positions,
  score.top12_hits,
  score.is_provisional
from public.scores as score
join public.predictions as prediction on prediction.id = score.prediction_id and prediction.status = 'submitted'
join public.profiles as profile on profile.id = prediction.user_id
join public.editions as edition on edition.id = prediction.edition_id
where edition.status in ('live', 'completed')
  and edition.predictions_deadline is not null and edition.predictions_deadline <= now()
  and exists (
    select 1 from public.ceremony_events as event
    where event.edition_id = edition.id and event.status = 'published' and event.candidate_id is not null
  );
grant select on public.leaderboard to anon, authenticated;

create or replace view public.league_live_standings as
select
  league.id as league_id,
  edition.year as edition_year,
  profile.username,
  score.total_points,
  score.exact_positions,
  score.top12_hits,
  score.is_provisional
from public.leagues as league
join public.editions as edition on edition.id = league.edition_id
join public.league_members as member on member.league_id = league.id
join public.profiles as profile on profile.id = member.user_id
join public.predictions as prediction on prediction.user_id = member.user_id
  and prediction.edition_id = league.edition_id and prediction.status = 'submitted'
join public.scores as score on score.prediction_id = prediction.id
where edition.status in ('live', 'completed');
revoke all on public.league_live_standings from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'league_event_reactions') then
      alter publication supabase_realtime add table public.league_event_reactions;
    end if;
  end if;
end;
$$;
notify pgrst, 'reload schema';
