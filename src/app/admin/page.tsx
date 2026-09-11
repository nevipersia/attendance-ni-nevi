import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { todayInSchoolTz } from "@/lib/today";
import { getSessionStatus, type SessionStatus } from "@/lib/session-status";

const STATUS_STYLES: Record<SessionStatus, string> = {
  open: "bg-emerald-50 text-emerald-800",
  upcoming: "bg-amber-50 text-amber-800",
  closed: "bg-neutral-100 text-neutral-500",
};

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/me");

  const supabase = await createClient();
  const today = todayInSchoolTz();

  // One round trip instead of three: embed the owning subject (inner
  // join, so it also filters to sessions this admin owns) and every
  // attendance row for that session, via their foreign keys.
  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      `id, subject_id, session_date, scheduled_start, scheduled_end,
       subjects!inner ( id, name, grace_minutes, admin_id ),
       attendance ( status )`,
    )
    .eq("subjects.admin_id", profile.id)
    .eq("session_date", today);

  const rows = (sessions ?? [])
    .map((session) => {
      const subject = Array.isArray(session.subjects)
        ? session.subjects[0]
        : session.subjects;
      if (!subject) return null;
      const status = getSessionStatus(
        session.scheduled_start,
        session.scheduled_end,
        subject.grace_minutes,
      );
      const tally = { present: 0, late: 0, absent: 0 };
      for (const row of session.attendance) {
        tally[row.status as "present" | "late" | "absent"]++;
      }
      return { session, subject, status, tally };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.session.scheduled_start.localeCompare(b.session.scheduled_start));

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">{profile.name}</h1>
            <p className="text-sm text-neutral-500">Admin</p>
          </div>
          <form action={signOut}>
            <button className="text-sm text-neutral-500 hover:text-neutral-800">Sign out</button>
          </form>
        </div>

        <nav className="flex gap-4 mb-8">
          <Link href="/admin" className="text-sm font-medium text-emerald-800 hover:underline">
            Today
          </Link>
          <Link
            href="/admin/subjects"
            className="text-sm font-medium text-neutral-500 hover:text-emerald-800 hover:underline"
          >
            Subjects
          </Link>
          <Link
            href="/admin/reports"
            className="text-sm font-medium text-neutral-500 hover:text-emerald-800 hover:underline"
          >
            Reports
          </Link>
          <Link
            href="/admin/students"
            className="text-sm font-medium text-neutral-500 hover:text-emerald-800 hover:underline"
          >
            Students
          </Link>
          <Link
            href="/schedule"
            className="text-sm font-medium text-neutral-500 hover:text-emerald-800 hover:underline"
          >
            Schedule
          </Link>
        </nav>

        <h2 className="text-sm font-medium text-neutral-500 mb-3">Today · {today}</h2>

        {!rows.length && (
          <p className="text-sm text-neutral-500 bg-white border border-neutral-200 rounded-lg p-4">
            No sessions today. Sessions are created automatically each morning from
            your subjects&rsquo; schedules.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {rows.map(({ session, subject, status, tally }) => (
            <div
              key={session.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{subject.name}</span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}
                >
                  {status}
                </span>
              </div>
              <div className="text-xs font-mono text-neutral-500">
                <span className="text-emerald-700">{tally.present}P</span>{" "}
                <span className="text-amber-700">{tally.late}L</span>{" "}
                <span className="text-red-700">{tally.absent}A</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/sessions/${session.id}/qr`}
                  className="text-xs font-medium bg-emerald-800 text-white rounded-md px-3 py-1.5"
                >
                  Show QR
                </Link>
                <Link
                  href={`/admin/sessions/${session.id}/mark`}
                  className="text-xs font-medium border border-neutral-300 rounded-md px-3 py-1.5"
                >
                  Mark manually
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
