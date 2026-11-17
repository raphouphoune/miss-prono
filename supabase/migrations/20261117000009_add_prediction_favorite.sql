alter table public.predictions
  add column favorite_candidate_id uuid;

alter table public.predictions
  add constraint predictions_favorite_candidate_id_edition_id_fkey
  foreign key (favorite_candidate_id, edition_id)
  references public.candidates (id, edition_id)
  on delete restrict;

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
  saved_prediction_status text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select edition.id into target_edition_id
    from public.editions as edition
    where edition.slug = target_edition_slug;

  if target_edition_id is null then
    raise exception 'Edition not found' using errcode = 'P0002';
  end if;

  if not public.is_prediction_draft_available(target_edition_id) then
    raise exception 'Favorite editing is not available for this edition' using errcode = 'P0001';
  end if;

  if favorite_candidate_slug is not null then
    select candidate.id into requested_candidate_id
      from public.candidates as candidate
      where candidate.edition_id = target_edition_id
        and candidate.slug = favorite_candidate_slug;

    if requested_candidate_id is null then
      raise exception 'Candidate not found in this edition' using errcode = '23503';
    end if;
  end if;

  insert into public.predictions (user_id, edition_id, status, favorite_candidate_id)
    values (current_user_id, target_edition_id, 'draft', requested_candidate_id)
    on conflict (user_id, edition_id) do update
      set favorite_candidate_id = excluded.favorite_candidate_id,
          updated_at = now()
      where public.predictions.status = 'draft'
        and public.is_prediction_draft_available(public.predictions.edition_id)
    returning id into saved_prediction_id;

  if saved_prediction_id is null then
    select prediction.status into saved_prediction_status
      from public.predictions as prediction
      where prediction.user_id = current_user_id
        and prediction.edition_id = target_edition_id;

    if saved_prediction_status = 'submitted' then
      raise exception 'Prediction already submitted' using errcode = '55000';
    end if;
    raise exception 'Favorite editing is not available for this edition' using errcode = 'P0001';
  end if;

  return saved_prediction_id;
end;
$$;

revoke all on function public.set_my_prediction_favorite(text, text) from public, anon;
grant execute on function public.set_my_prediction_favorite(text, text) to authenticated;
notify pgrst, 'reload schema';
