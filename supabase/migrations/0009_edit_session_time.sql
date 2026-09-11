-- Lets an admin adjust a single session's time for today only (e.g. a
-- last-minute room/time change), without touching the subject's
-- regular weekly schedule.
--
-- Deliberately NOT security definer: it runs as the calling user, so
-- the existing sessions_write_admin RLS policy still governs who can
-- actually update the row -- a non-owning admin's call just updates
-- zero rows instead of needing a separate ownership check here.

create function public.update_session_local_time(
  p_session_id uuid,
  p_start_time time,
  p_end_time time
)
returns void
language plpgsql
as $$
declare
  tz text := 'Asia/Manila';
  d date;
begin
  if p_end_time <= p_start_time then
    raise exception 'end time must be after start time';
  end if;

  select session_date into d from sessions where id = p_session_id;
  if d is null then
    raise exception 'session not found';
  end if;

  update sessions
  set
    scheduled_start = (d::text || ' ' || p_start_time::text)::timestamp at time zone tz,
    scheduled_end = (d::text || ' ' || p_end_time::text)::timestamp at time zone tz
  where id = p_session_id;
end;
$$;

grant execute on function public.update_session_local_time(uuid, time, time) to authenticated;
