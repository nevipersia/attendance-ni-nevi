-- Reports: flat present/late/absent counts per student per subject.
-- security_invoker means the view runs with the querying user's own
-- permissions, so it respects the attendance RLS policies from 0001_init.sql
-- automatically (a student sees only their own row, an admin sees every
-- student in a subject they own).

create view attendance_summary
with (security_invoker = true)
as
select
  sessions.subject_id,
  attendance.student_id,
  count(*) filter (where attendance.status = 'present') as present_count,
  count(*) filter (where attendance.status = 'late') as late_count,
  count(*) filter (where attendance.status = 'absent') as absent_count
from attendance
join sessions on sessions.id = attendance.session_id
group by sessions.subject_id, attendance.student_id;
