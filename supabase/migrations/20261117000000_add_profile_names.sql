create table public.private_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.private_profiles enable row level security;
revoke all on public.private_profiles from anon, authenticated;
grant select, update on public.private_profiles to authenticated;

create policy "users read their private profile" on public.private_profiles
for select to authenticated using (id = auth.uid());
create policy "users update their private profile" on public.private_profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger private_profiles_set_updated_at before update on public.private_profiles
for each row execute function public.set_updated_at();

insert into public.private_profiles (id, first_name, last_name)
select
  profiles.id,
  nullif(trim(auth_users.raw_user_meta_data ->> 'first_name'), ''),
  nullif(trim(auth_users.raw_user_meta_data ->> 'last_name'), '')
from public.profiles as profiles
left join auth.users as auth_users on auth_users.id = profiles.id
on conflict (id) do nothing;

create or replace function public.update_my_profile(p_first_name text, p_last_name text, p_username text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if char_length(trim(p_first_name)) not between 1 and 80
    or char_length(trim(p_last_name)) not between 1 and 80
    or char_length(trim(p_username)) not between 3 and 32
    or trim(p_username) !~ '^[[:alnum:]_-]+$' then
    raise exception 'Profile details are invalid' using errcode = '23514';
  end if;

  update public.profiles
  set username = trim(p_username)
  where id = auth.uid();
  if not found then raise exception 'Profile not found' using errcode = 'P0002'; end if;

  insert into public.private_profiles (id, first_name, last_name)
  values (auth.uid(), trim(p_first_name), trim(p_last_name))
  on conflict (id) do update
  set first_name = excluded.first_name, last_name = excluded.last_name;
end;
$$;

revoke all on function public.update_my_profile(text, text, text) from public, anon;
grant execute on function public.update_my_profile(text, text, text) to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_username text;
  requested_first_name text;
  requested_last_name text;
begin
  requested_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  requested_first_name := nullif(trim(new.raw_user_meta_data ->> 'first_name'), '');
  requested_last_name := nullif(trim(new.raw_user_meta_data ->> 'last_name'), '');

  if requested_username is null or char_length(requested_username) not between 3 and 32
    or requested_username !~ '^[[:alnum:]_-]+$'
    or requested_first_name is null or char_length(requested_first_name) > 80
    or requested_last_name is null or char_length(requested_last_name) > 80 then
    raise exception 'Required profile details are missing or invalid' using errcode = '23514';
  end if;

  insert into public.profiles (id, username)
  values (
    new.id,
    requested_username
  )
  on conflict (id) do nothing;

  insert into public.private_profiles (id, first_name, last_name)
  values (new.id, requested_first_name, requested_last_name)
  on conflict (id) do nothing;

  return new;
end;
$$;
