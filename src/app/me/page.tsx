import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function StudentPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/admin");

  const supabase = await createClient();

  const { data: summary } = await supabase
    .from("attendance_summary")
    .select("subject_id, present_count, late_count, absent_count")
    .eq("student_id", profile.id);

  const subjectIds = summary?.map((s) => s.subject_id) ?? [];
  const { data: subjects } = subjectIds.length
    ? await supabase.from("subjects").select("id, name").in("id", subjectIds)
    : { data: [] };

  const nameById = new Map(subjects?.map((s) => [s.id, s.name]));
  const rows = (summary ?? [])
    .map((s) => ({ ...s, name: nameById.get(s.subject_id) ?? "Unknown subject" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-lg font-semibold">{profile.name}</h1>
            <p className="text-sm text-neutral-500">Student</p>
          </div>
          <form action={signOut}>
            <button className="text-sm text-neutral-500 hover:text-neutral-800">Sign out</button>
          </form>
        </div>

        <h2 className="text-sm font-medium text-neutral-500 mb-3">My attendance</h2>

        {!rows.length && (
          <p className="text-sm text-neutral-500 bg-white border border-neutral-200 rounded-lg p-4">
            No attendance recorded yet. Scan a subject&rsquo;s QR code during class to
            check in.
          </p>
        )}

        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
          {rows.map((r) => (
            <div key={r.subject_id} className="flex items-center justify-between p-4">
              <span className="text-sm font-medium">{r.name}</span>
              <span className="text-xs font-mono">
                <span className="text-emerald-700">{r.present_count}P</span>{" "}
                <span className="text-amber-700">{r.late_count}L</span>{" "}
                <span className="text-red-700">{r.absent_count}A</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
