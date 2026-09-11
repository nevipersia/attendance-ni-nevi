-- QR check-in now stays valid for the whole session (until
-- scheduled_end) instead of closing at +30min. A scan 30+ minutes
-- after scheduled_start still gets recorded, just as status='absent'
-- instead of being turned away entirely.

drop policy "attendance_insert_self_qr" on attendance;

create policy "attendance_insert_self_qr"
  on attendance for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and status in ('present', 'late', 'absent')
    and method = 'qr'
    and exists (select 1 from profiles where id = auth.uid() and active = true)
    and exists (
      select 1 from sessions
      join subjects on subjects.id = sessions.subject_id
      where sessions.id = attendance.session_id
        and now() between
          sessions.scheduled_start - make_interval(mins => subjects.grace_minutes)
          and sessions.scheduled_end
    )
  );
