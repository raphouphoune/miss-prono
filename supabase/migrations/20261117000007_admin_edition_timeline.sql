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
  published_result_count integer;
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
    select count(*) into published_result_count
      from public.results where edition_id = target_edition_id and published;
    if published_result_count <> 12 then
      raise exception 'Publish the 12 official results before completing the edition' using errcode = '23514';
    end if;
  end if;

  update public.editions
    set status = target_status,
        predictions_deadline = target_predictions_deadline,
        ceremony_at = target_ceremony_at
    where id = target_edition_id;
  if not found then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.admin_update_edition_timeline(uuid, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_update_edition_timeline(uuid, text, timestamptz, timestamptz) to authenticated;
notify pgrst, 'reload schema';
