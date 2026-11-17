-- Allow players to organize their private leagues while an edition is being
-- prepared, matching the draft prediction window. Joining closes at deadline.
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
    where id = target_edition_id
      and (
        (status = 'upcoming' and (predictions_deadline is null or predictions_deadline > now()))
        or (status = 'open' and predictions_deadline > now())
      )
  ) then
    raise exception 'This edition is not available for league creation';
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
  select league.id into found_league_id
    from public.leagues as league
    join public.editions as edition on edition.id = league.edition_id
    where upper(league.invite_code) = upper(trim(invitation_code))
      and (
        (edition.status = 'upcoming' and (edition.predictions_deadline is null or edition.predictions_deadline > now()))
        or (edition.status = 'open' and edition.predictions_deadline > now())
      );
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
notify pgrst, 'reload schema';
