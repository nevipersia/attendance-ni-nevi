-- Attendance system: initial schema
-- Run this in the Supabase SQL editor (Database > SQL Editor) on your project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth user. Created automatically on signup by the trigger
-- below. `role` decides whether someone is treated as admin or student.
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin', 'student')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
-- Expects `name` and `role` to be passed in signUp's `options.data`.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- subjects
-- Subject = class. Owned by one admin. `grace_minutes` widens the
-- check-in window on either side of the scheduled start/end.
-- ---------------------------------------------------------------------------
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_id uuid not null references profiles (id) on delete cascade,
  grace_minutes int not null default 10,
  created_at timestamptz not null default now()
);

create index subjects_admin_id_idx on subjects (admin_id);

-- ---------------------------------------------------------------------------
-- subject_schedule
-- Weekly recurring slots for a subject. A daily cron job reads this to
-- stamp out concrete `sessions` rows for the day.
-- ---------------------------------------------------------------------------
create table subject_schedule (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  constraint schedule_time_order check (end_time > start_time)
);

create index subject_schedule_subject_id_idx on subject_schedule (subject_id);

-- ---------------------------------------------------------------------------
-- sessions
-- One concrete class meeting. Created by the daily cron from
-- subject_schedule. Status (upcoming/open/closed) is computed from
-- scheduled_start/scheduled_end + the subject's grace period, not stored.
-- ---------------------------------------------------------------------------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects (id) on delete cascade,
  session_date date not null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  qr_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now(),
  unique (subject_id, session_date)
);

create index sessions_subject_id_idx on sessions (subject_id);
create index sessions_qr_token_idx on sessions (qr_token);

-- ---------------------------------------------------------------------------
-- attendance
-- One row per student per session. `status` present/late/absent.
-- `method` distinguishes a student's own QR scan from an admin override.
-- ---------------------------------------------------------------------------
create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent')),
  method text not null check (method in ('qr', 'manual')),
  marked_at timestamptz not null default now(),
  unique (session_id, student_id)
);

create index attendance_session_id_idx on attendance (session_id);
create index attendance_student_id_idx on attendance (student_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table subject_schedule enable row level security;
alter table sessions enable row level security;
alter table attendance enable row level security;

-- profiles: everyone signed in can read names/roles (needed for admin
-- reports and QR check-in display); only your own row can be updated.
create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid());

-- subjects: any signed-in user can read (students need subject names);
-- only the owning admin can create/edit/delete.
create policy "subjects_select_authenticated"
  on subjects for select
  to authenticated
  using (true);

create policy "subjects_insert_admin"
  on subjects for insert
  to authenticated
  with check (
    admin_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "subjects_update_admin"
  on subjects for update
  to authenticated
  using (admin_id = auth.uid());

create policy "subjects_delete_admin"
  on subjects for delete
  to authenticated
  using (admin_id = auth.uid());

-- subject_schedule: readable by anyone signed in; writable only by the
-- admin who owns the parent subject.
create policy "schedule_select_authenticated"
  on subject_schedule for select
  to authenticated
  using (true);

create policy "schedule_write_admin"
  on subject_schedule for all
  to authenticated
  using (
    exists (
      select 1 from subjects
      where subjects.id = subject_schedule.subject_id
        and subjects.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from subjects
      where subjects.id = subject_schedule.subject_id
        and subjects.admin_id = auth.uid()
    )
  );

-- sessions: readable by anyone signed in (needed to resolve a scanned QR
-- token and to show status); writable by the owning admin (the daily
-- cron runs with the service_role key and bypasses RLS entirely).
create policy "sessions_select_authenticated"
  on sessions for select
  to authenticated
  using (true);

create policy "sessions_write_admin"
  on sessions for all
  to authenticated
  using (
    exists (
      select 1 from subjects
      where subjects.id = sessions.subject_id
        and subjects.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from subjects
      where subjects.id = sessions.subject_id
        and subjects.admin_id = auth.uid()
    )
  );

-- attendance: a student can read only their own rows; an admin can read
-- every row belonging to a subject they own.
create policy "attendance_select_own"
  on attendance for select
  to authenticated
  using (student_id = auth.uid());

create policy "attendance_select_admin"
  on attendance for select
  to authenticated
  using (
    exists (
      select 1 from sessions
      join subjects on subjects.id = sessions.subject_id
      where sessions.id = attendance.session_id
        and subjects.admin_id = auth.uid()
    )
  );

-- A student may only ever write their own "present" row, via the QR
-- check-in page, and only while the session is inside its open window.
create policy "attendance_insert_self_qr"
  on attendance for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and status = 'present'
    and method = 'qr'
    and exists (
      select 1 from sessions
      join subjects on subjects.id = sessions.subject_id
      where sessions.id = attendance.session_id
        and now() between
          sessions.scheduled_start - make_interval(mins => subjects.grace_minutes)
          and sessions.scheduled_end + make_interval(mins => subjects.grace_minutes)
    )
  );

-- An admin may insert/update/delete any attendance row for a session
-- under a subject they own (manual marking and overrides).
create policy "attendance_write_admin"
  on attendance for all
  to authenticated
  using (
    exists (
      select 1 from sessions
      join subjects on subjects.id = sessions.subject_id
      where sessions.id = attendance.session_id
        and subjects.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sessions
      join subjects on subjects.id = sessions.subject_id
      where sessions.id = attendance.session_id
        and subjects.admin_id = auth.uid()
    )
  );
