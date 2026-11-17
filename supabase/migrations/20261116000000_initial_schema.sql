-- Miss Prono: relational foundation and row-level security.
-- Prediction access is time-gated in PostgreSQL. Do not move these rules into the UI only.

create table public.editions (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year between 2020 and 2200),
  slug text not null unique,
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'upcoming', 'open', 'locked', 'live', 'completed')),
  predictions_deadline timestamptz,
  ceremony_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 32),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- This table is intentionally inaccessible to browser roles. Admin membership is assigned
-- out of band by a trusted operator, never by a client-side profile field.
create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on public.app_admins from anon, authenticated;

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  slug text not null,
  candidate_number smallint not null check (candidate_number > 0),
  name text not null,
  region text not null,
  age smallint check (age between 16 and 100),
  height_cm smallint check (height_cm between 100 and 250),
  hometown text,
  education text,
  occupation text,
  elected_on date,
  elected_at text,
  passions text[] not null default '{}',
  commitments text[] not null default '{}',
  biography text,
  instagram_url text,
  photo_url text,
  official_source_url text,
  profile_source_url text,
  photo_source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, slug),
  unique (edition_id, candidate_number),
  unique (id, edition_id)
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  edition_id uuid not null references public.editions(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, edition_id),
  unique (id, edition_id),
  check ((status = 'draft' and submitted_at is null) or (status = 'submitted' and submitted_at is not null))
);

create table public.prediction_choices (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null,
  edition_id uuid not null,
  candidate_id uuid not null,
  rank smallint not null check (rank between 1 and 12),
  created_at timestamptz not null default now(),
  foreign key (prediction_id, edition_id) references public.predictions(id, edition_id) on delete cascade,
  foreign key (candidate_id, edition_id) references public.candidates(id, edition_id) on delete restrict,
  unique (prediction_id, rank),
  unique (prediction_id, candidate_id)
);

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 48),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null,
  candidate_id uuid not null,
  final_rank smallint not null check (final_rank between 1 and 12),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (candidate_id, edition_id) references public.candidates(id, edition_id) on delete restrict,
  unique (edition_id, candidate_id),
  unique (edition_id, final_rank)
);

create table public.scoring_rules (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  rank smallint not null check (rank between 1 and 12),
  points integer not null check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, rank)
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null unique references public.predictions(id) on delete cascade,
  total_points integer not null default 0 check (total_points >= 0),
  exact_positions smallint not null default 0 check (exact_positions between 0 and 12),
  calculated_at timestamptz not null default now()
);

create table public.ceremony_events (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.editions(id) on delete cascade,
  stage text not null check (stage in ('selection', 'semi_finalists', 'finalists', 'winner', 'custom')),
  title text not null,
  body text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'draft' and published_at is null) or (status = 'published' and published_at is not null))
);

create index candidates_edition_region_idx on public.candidates (edition_id, region);
create index predictions_edition_status_idx on public.predictions (edition_id, status);
create index prediction_choices_candidate_idx on public.prediction_choices (candidate_id);
create index league_members_user_idx on public.league_members (user_id);
create index results_edition_published_idx on public.results (edition_id, published, final_rank);
create index scores_points_idx on public.scores (total_points desc);
create index ceremony_events_edition_status_idx on public.ceremony_events (edition_id, status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger editions_set_updated_at before update on public.editions
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger candidates_set_updated_at before update on public.candidates
for each row execute function public.set_updated_at();
create trigger predictions_set_updated_at before update on public.predictions
for each row execute function public.set_updated_at();
create trigger leagues_set_updated_at before update on public.leagues
for each row execute function public.set_updated_at();
create trigger results_set_updated_at before update on public.results
for each row execute function public.set_updated_at();
create trigger scoring_rules_set_updated_at before update on public.scoring_rules
for each row execute function public.set_updated_at();
create trigger ceremony_events_set_updated_at before update on public.ceremony_events
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'membre-' || left(replace(new.id::text, '-', ''), 8))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;
revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to anon, authenticated;

create or replace function public.is_league_member(target_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.league_members
    where league_id = target_league_id and user_id = auth.uid()
  );
$$;
revoke all on function public.is_league_member(uuid) from public;
grant execute on function public.is_league_member(uuid) to authenticated;

create or replace function public.guard_prediction_submission()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  deadline timestamptz;
  edition_status text;
  selected_count integer;
begin
  if tg_op = 'UPDATE' and (new.user_id is distinct from old.user_id or new.edition_id is distinct from old.edition_id) then
    raise exception 'Prediction owner and edition cannot be changed';
  end if;

  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    select predictions_deadline, status into deadline, edition_status
      from public.editions where id = new.edition_id;
    if edition_status is distinct from 'open' or deadline is null or deadline <= now() then
      raise exception 'Predictions are closed for this edition';
    end if;
    select count(*) into selected_count from public.prediction_choices where prediction_id = new.id;
    if selected_count <> 12 then
      raise exception 'A submitted prediction must contain exactly 12 candidates';
    end if;
    new.submitted_at := now();
  elsif new.status = 'draft' then
    new.submitted_at := null;
  elsif tg_op = 'UPDATE' then
    new.submitted_at := old.submitted_at;
  end if;
  return new;
end;
$$;

create trigger predictions_guard_submission before insert or update on public.predictions
for each row execute function public.guard_prediction_submission();

create or replace function public.guard_league_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.edition_id is distinct from old.edition_id
    or new.owner_id is distinct from old.owner_id
    or new.invite_code is distinct from old.invite_code then
    raise exception 'League edition, owner, and invite code cannot be changed';
  end if;
  return new;
end;
$$;

create trigger leagues_guard_identity before update on public.leagues
for each row execute function public.guard_league_identity();

create or replace function public.create_league(target_edition_id uuid, league_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  new_league_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(league_name)) not between 3 and 48 then
    raise exception 'League name must contain between 3 and 48 characters';
  end if;
  if not exists (
    select 1 from public.editions
    where id = target_edition_id and status = 'open'
      and predictions_deadline is not null and predictions_deadline > now()
  ) then
    raise exception 'This edition is not open for league creation';
  end if;

  insert into public.leagues (edition_id, owner_id, name)
  values (target_edition_id, current_user_id, trim(league_name))
  returning id into new_league_id;
  insert into public.league_members (league_id, user_id)
  values (new_league_id, current_user_id);
  return new_league_id;
end;
$$;
revoke all on function public.create_league(uuid, text) from public;
grant execute on function public.create_league(uuid, text) to authenticated;

create or replace function public.join_league_with_code(invitation_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  found_league_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  select l.id into found_league_id
    from public.leagues l
    join public.editions e on e.id = l.edition_id
    where upper(l.invite_code) = upper(trim(invitation_code))
      and e.status = 'open' and e.predictions_deadline > now();
  if found_league_id is null then
    raise exception 'Invitation code is invalid or the edition is closed';
  end if;
  insert into public.league_members (league_id, user_id)
  values (found_league_id, current_user_id)
  on conflict (league_id, user_id) do nothing;
  return found_league_id;
end;
$$;
revoke all on function public.join_league_with_code(text) from public;
grant execute on function public.join_league_with_code(text) to authenticated;

alter table public.editions enable row level security;
alter table public.profiles enable row level security;
alter table public.app_admins enable row level security;
alter table public.candidates enable row level security;
alter table public.predictions enable row level security;
alter table public.prediction_choices enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.results enable row level security;
alter table public.scoring_rules enable row level security;
alter table public.scores enable row level security;
alter table public.ceremony_events enable row level security;

create policy "published editions are readable" on public.editions
for select to anon, authenticated using (status <> 'draft' or public.is_app_admin());
create policy "admins manage editions" on public.editions
for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

create policy "profiles are public" on public.profiles
for select to anon, authenticated using (true);
create policy "users update their profile" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "candidates for visible editions are readable" on public.candidates
for select to anon, authenticated using (
  public.is_app_admin() or exists (
    select 1 from public.editions e where e.id = edition_id and e.status <> 'draft'
  )
);
create policy "admins manage candidates" on public.candidates
for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

create policy "users and post-deadline participants read predictions" on public.predictions
for select to authenticated using (
  user_id = auth.uid() or (
    status = 'submitted' and exists (
      select 1 from public.editions e
      where e.id = edition_id and predictions_deadline is not null and predictions_deadline <= now()
    )
  )
);
create policy "users create drafts while an edition is open" on public.predictions
for insert to authenticated with check (
  user_id = auth.uid() and status = 'draft' and exists (
    select 1 from public.editions e where e.id = edition_id
      and e.status = 'open' and e.predictions_deadline > now()
  )
);
create policy "users edit their prediction before deadline" on public.predictions
for update to authenticated using (
  user_id = auth.uid() and exists (
    select 1 from public.editions e where e.id = edition_id
      and e.status = 'open' and e.predictions_deadline > now()
  )
) with check (
  user_id = auth.uid() and status in ('draft', 'submitted') and exists (
    select 1 from public.editions e where e.id = edition_id
      and e.status = 'open' and e.predictions_deadline > now()
  )
);
create policy "users delete their prediction before deadline" on public.predictions
for delete to authenticated using (
  user_id = auth.uid() and exists (
    select 1 from public.editions e where e.id = edition_id
      and e.status = 'open' and e.predictions_deadline > now()
  )
);

create policy "choices follow prediction visibility" on public.prediction_choices
for select to authenticated using (
  exists (select 1 from public.predictions p where p.id = prediction_id)
);
create policy "owners edit choices only in draft before deadline" on public.prediction_choices
for insert to authenticated with check (
  exists (
    select 1 from public.predictions p join public.editions e on e.id = p.edition_id
    where p.id = prediction_id and p.edition_id = edition_id
      and p.user_id = auth.uid() and p.status = 'draft'
      and e.status = 'open' and e.predictions_deadline > now()
  )
);
create policy "owners update choices only in draft before deadline" on public.prediction_choices
for update to authenticated using (
  exists (
    select 1 from public.predictions p join public.editions e on e.id = p.edition_id
    where p.id = prediction_id and p.edition_id = edition_id
      and p.user_id = auth.uid() and p.status = 'draft'
      and e.status = 'open' and e.predictions_deadline > now()
  )
) with check (
  exists (
    select 1 from public.predictions p join public.editions e on e.id = p.edition_id
    where p.id = prediction_id and p.edition_id = edition_id
      and p.user_id = auth.uid() and p.status = 'draft'
      and e.status = 'open' and e.predictions_deadline > now()
  )
);
create policy "owners delete choices only in draft before deadline" on public.prediction_choices
for delete to authenticated using (
  exists (
    select 1 from public.predictions p join public.editions e on e.id = p.edition_id
    where p.id = prediction_id and p.edition_id = edition_id
      and p.user_id = auth.uid() and p.status = 'draft'
      and e.status = 'open' and e.predictions_deadline > now()
  )
);

create policy "members read their leagues" on public.leagues
for select to authenticated using (owner_id = auth.uid() or public.is_league_member(id) or public.is_app_admin());
create policy "owners update leagues" on public.leagues
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete leagues" on public.leagues
for delete to authenticated using (owner_id = auth.uid());
create policy "members read league membership" on public.league_members
for select to authenticated using (public.is_league_member(league_id) or public.is_app_admin());
create policy "users leave leagues" on public.league_members
for delete to authenticated using (user_id = auth.uid());

create policy "published results are public" on public.results
for select to anon, authenticated using (
  public.is_app_admin() or (published and exists (
    select 1 from public.editions e where e.id = edition_id and e.status in ('live', 'completed')
  ))
);
create policy "admins manage results" on public.results
for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
create policy "published scores are readable" on public.scores
for select to authenticated using (
  exists (
    select 1 from public.predictions p join public.editions e on e.id = p.edition_id
    where p.id = prediction_id and e.status in ('live', 'completed')
  )
);
create policy "scoring rules are readable" on public.scoring_rules
for select to anon, authenticated using (
  public.is_app_admin() or exists (
    select 1 from public.editions e where e.id = edition_id and e.status <> 'draft'
  )
);
create policy "admins manage scoring rules" on public.scoring_rules
for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

create policy "published ceremony events are public" on public.ceremony_events
for select to anon, authenticated using (
  public.is_app_admin() or (status = 'published' and exists (
    select 1 from public.editions e where e.id = edition_id and e.status in ('live', 'completed')
  ))
);
create policy "admins manage ceremony events" on public.ceremony_events
for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

grant usage on schema public to anon, authenticated;
grant select on public.editions, public.candidates, public.profiles, public.results, public.scoring_rules, public.ceremony_events to anon, authenticated;
grant insert, update, delete on public.editions, public.candidates, public.results, public.scoring_rules, public.ceremony_events to authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.predictions, public.prediction_choices to authenticated;
grant select, update, delete on public.leagues to authenticated;
grant select, delete on public.league_members to authenticated;
grant select on public.scores to authenticated;

-- The proposed scoring barème is intentionally not seeded. It needs explicit product approval.
