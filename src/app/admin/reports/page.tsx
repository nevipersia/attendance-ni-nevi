import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/me");

  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("admin_id", profile.id)
    .order("name");

  const { subject: subjectParam } = await searchParams;
  const activeSubjectId = subjectParam ?? subjects?.[0]?.id;
  const activeSubject = subjects?.find((s) => s.id === activeSubjectId);

  const { data: summary } = activeSubjectId
    ? await supabase
        .from("attendance_summary")
        .select("student_id, present_count, late_count, absent_count")
        .eq("subject_id", activeSubjectId)
    : { data: [] };

  const studentIds = summary?.map((s) => s.student_id) ?? [];
  const { data: students } = studentIds.length
    ? await supabase.from("profiles").select("id, name").in("id", studentIds)
    : { data: [] };

  const nameById = new Map(students?.map((s) => [s.id, s.name]));
  const rows = (summary ?? [])
    .map((s) => ({ ...s, name: nameById.get(s.student_id) ?? "Unknown student" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">Reports</h1>
            <p className="text-sm text-neutral-500">
              <Link href="/admin" className="hover:underline">
                ← Today
              </Link>
            </p>
          </div>
        </div>

        {!subjects?.length && (
          <p className="text-sm text-neutral-500 bg-white border border-neutral-200 rounded-lg p-4">
            No subjects yet.
          </p>
        )}

        {!!subjects?.length && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {subjects.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/reports?subject=${s.id}`}
                  className={`text-xs font-medium rounded-full px-3 py-1.5 border ${
                    s.id === activeSubjectId
                      ? "bg-emerald-800 text-white border-transparent"
                      : "bg-white text-neutral-600 border-neutral-300"
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-500 font-mono">
                    <th className="px-4 py-2.5 font-medium">Student</th>
                    <th className="px-4 py-2.5 font-medium text-right">Present</th>
                    <th className="px-4 py-2.5 font-medium text-right">Late</th>
                    <th className="px-4 py-2.5 font-medium text-right">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {!rows.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-neutral-500">
                        No attendance recorded yet for {activeSubject?.name}.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.student_id}>
                      <td className="px-4 py-2.5 font-medium">{r.name}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-700">
                        {r.present_count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-amber-700">
                        {r.late_count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-red-700">
                        {r.absent_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
