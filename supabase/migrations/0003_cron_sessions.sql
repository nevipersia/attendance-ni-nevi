-- Daily session generation, run by a Vercel Cron job hitting
-- /api/cron/create-sessions once a day. Does the date/timezone math in
-- Postgres (rather than JS) so it can't drift from server-clock quirks.
--
-- Adjust the timezone below if the school isn't in Asia/Manila.

create or replace function public.create_todays_sessions()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  tz text := 'Asia/Manila';
  today date := (now() at time zone tz)::date;
  dow int := extract(dow from (now() at time zone tz));
begin
  insert into sessions (subject_id, session_date, scheduled_start, scheduled_end)
  select
    ss.subject_id,
    today,
    (today::text || ' ' || ss.start_time::text)::timestamp at time zone tz,
    (today::text || ' ' || ss.end_time::text)::timestamp at time zone tz
  from subject_schedule ss
  where ss.day_of_week = dow
  on conflict (subject_id, session_date) do nothing;
end;
$$;

-- security definer means this runs with the function owner's privileges
-- (bypassing RLS) regardless of who calls it, so the cron route can call
-- it with just the publishable key. It's still gated by the route's own
-- CRON_SECRET check, not by database permissions.
grant execute on function public.create_todays_sessions() to anon, authenticated;
