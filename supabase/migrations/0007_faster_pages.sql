-- Denormalize subject/student names straight into the summary view so
-- /me and /admin/reports can read everything in one round trip instead
-- of fetching the summary, then making a second query to resolve names.
--
-- `create or replace view` refuses to change existing column positions,
-- so this drops and recreates the view outright instead.

drop view attendance_summary;

create view attendance_summary
with (security_invoker = true)
as
select
  sessions.subject_id,
  subjects.name as subject_name,
  attendance.student_id,
  profiles.name as student_name,
  count(*) filter (where attendance.status = 'present') as present_count,
  count(*) filter (where attendance.status = 'late') as late_count,
  count(*) filter (where attendance.status = 'absent') as absent_count
from attendance
join sessions on sessions.id = attendance.session_id
join subjects on subjects.id = sessions.subject_id
join profiles on profiles.id = attendance.student_id
group by sessions.subject_id, subjects.name, attendance.student_id, profiles.name;
