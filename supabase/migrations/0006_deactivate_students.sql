-- Lets an admin "remove" a student without deleting their account or
-- attendance history: active = false blocks login (enforced in
-- middleware) and hides them from admin lists, but every past
-- attendance row stays exactly as it was.

alter table profiles add column if not exists active boolean not null default true;

-- Any admin can update any profile (e.g. to deactivate a student).
-- The role column is still separately locked by
-- prevent_role_self_change from migration 0004 -- an admin acting
-- through the app can't grant admin any more than a student can.
create policy "profiles_update_admin"
  on profiles for update
  to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (true);

-- A deactivated student can no longer self check-in via QR, even if
-- their session cookie is somehow still around.
drop policy "attendance_insert_self_qr" on attendance;

create policy "attendance_insert_self_qr"
  on attendance for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and status in ('present', 'late')
    and method = 'qr'
    and exists (select 1 from profiles where id = auth.uid() and active = true)
    and exists (
      select 1 from sessions
      join subjects on subjects.id = sessions.subject_id
      where sessions.id = attendance.session_id
        and now() between
          sessions.scheduled_start - make_interval(mins => subjects.grace_minutes)
          and sessions.scheduled_start + make_interval(mins => 30)
    )
  );
