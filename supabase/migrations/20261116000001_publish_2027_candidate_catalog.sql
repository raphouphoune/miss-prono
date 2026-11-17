-- Public candidate catalogue: keep an unconfigured 2027 edition visible while
-- leaving predictions closed until an administrator sets the deadline and opens it.
update public.editions
set status = 'upcoming', updated_at = now()
where slug = 'miss-france-2027' and status = 'draft';
