-- Run this ONCE in the Supabase SQL Editor (after 001_schema.sql).
-- It lets the owner dashboard release stock from unpaid orders whenever the owner opens
-- the Orders page or the Overview, so you do not depend on a scheduled job.

create or replace function public.run_expiry() returns integer
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return public.expire_unpaid_orders();
end $$;

revoke all on function public.run_expiry() from public, anon;
grant execute on function public.run_expiry() to authenticated;
