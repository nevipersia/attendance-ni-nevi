# Attendance System

A scheduled, self-service attendance system for a small school. Admins
manage subjects and their weekly schedule; sessions are created
automatically each day; students check in by scanning a QR code (or get
marked manually), and reports show flat present/late/absent counts —
no percentage.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind)
- [Supabase](https://supabase.com) (Postgres, Auth, Row Level Security)
- [Vercel Cron](https://vercel.com/docs/cron-jobs) for daily session generation

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then copy `.env.local.example` to
   `.env.local` and fill in:

   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
     Project Settings → API in the Supabase dashboard.
   - `CRON_SECRET` — any long random string. Vercel automatically sends
     it as a bearer token to cron routes when set as a project env var.

3. In the Supabase SQL editor, run the migrations in
   `supabase/migrations/` **in order** (`0001`, `0002`, `0003`).

4. In Supabase → Authentication → Sign In / Providers → Email, turn off
   **Confirm email** for easier local testing (re-enable for a real
   deployment if you want email verification).

5. Run the dev server:

   ```bash
   npm run dev
   ```

## How it works

- **Subjects** = classes. Admins create/edit/delete them and set a
  weekly schedule (day + start/end time) under `/admin/subjects`.
- **Sessions** are stamped out daily by a Postgres function
  (`create_todays_sessions`), triggered by `/api/cron/create-sessions`
  on Vercel's cron schedule (`vercel.json`). A session's status
  (upcoming/open/closed) is computed from its scheduled time plus the
  subject's grace period — nothing is manually "started."
- **Check-in**: the admin's `/admin` "Today" view shows a QR per open
  session (`/admin/sessions/[id]/qr`). Students scan it with their
  phone's camera, sign in if needed (bounced back via `returnTo`), and
  are marked present. Admins can also mark/override any student
  directly (`/admin/sessions/[id]/mark`).
- **Reports** (`/admin/reports`) show raw present/late/absent counts
  per student per subject. Students see only their own counts (`/me`);
  admins see every student in a subject they own — enforced by
  Postgres Row Level Security, not app-level checks.

## Deploying

Deploy to Vercel, set the same environment variables there (including
`CRON_SECRET`), and the cron job in `vercel.json` will start running on
schedule automatically.
