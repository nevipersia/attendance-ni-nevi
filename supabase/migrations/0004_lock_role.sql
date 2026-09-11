-- Prevent role escalation: a signed-in user calling through the app
-- (PostgREST, auth.role() = 'authenticated') can update their own name
-- but never their own role. Role changes must be made directly in
-- Supabase (SQL editor or Table editor), which connects as the
-- postgres/service role, not 'authenticated', so this trigger doesn't
-- block that path.

create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role <> old.role and auth.role() = 'authenticated' then
    raise exception 'role can only be changed directly in Supabase, not through the app';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_change
  before update on profiles
  for each row execute procedure public.prevent_role_self_change();
