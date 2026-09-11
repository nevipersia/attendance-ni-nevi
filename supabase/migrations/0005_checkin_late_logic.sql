-- Match the app's check-in bands: present before scheduled_start, late
-- from +10min, self check-in closes entirely at +30min (subjects.
-- grace_minutes still controls how early the window opens beforehand).
-- Replaces the old policy, which only allowed status='present' and
-- computed its closing edge from scheduled_end + grace.

drop policy "attendance_insert_self_qr" on attendance;

create policy "attendance_insert_self_qr"
  on attendance for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and status in ('present', 'late')
    and method = 'qr'
    and exists (
      select 1 from sessions
      join subjects on subjects.id = sessions.subject_id
      where sessions.id = attendance.session_id
        and now() between
          sessions.scheduled_start - make_interval(mins => subjects.grace_minutes)
          and sessions.scheduled_start + make_interval(mins => 30)
    )
  );
