insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-photos',
  'candidate-photos',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read candidate photos" on storage.objects;
create policy "public read candidate photos" on storage.objects
for select to anon, authenticated using (bucket_id = 'candidate-photos');

drop policy if exists "admins upload candidate photos" on storage.objects;
create policy "admins upload candidate photos" on storage.objects
for insert to authenticated with check (bucket_id = 'candidate-photos' and public.is_app_admin());

drop policy if exists "admins update candidate photos" on storage.objects;
create policy "admins update candidate photos" on storage.objects
for update to authenticated using (bucket_id = 'candidate-photos' and public.is_app_admin())
with check (bucket_id = 'candidate-photos' and public.is_app_admin());

drop policy if exists "admins delete candidate photos" on storage.objects;
create policy "admins delete candidate photos" on storage.objects
for delete to authenticated using (bucket_id = 'candidate-photos' and public.is_app_admin());
