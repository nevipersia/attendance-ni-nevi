import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { setStudentActive } from "@/lib/actions/students";

export default async function StudentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/me");

  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("id, name, active")
    .eq("role", "student")
    .order("name");

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">Students</h1>
            <p className="text-sm text-neutral-500">
              <Link href="/admin" className="hover:underline">
                ← Today
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
          {!students?.length && (
            <p className="p-4 text-sm text-neutral-500">No students yet.</p>
          )}
          {students?.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-4 gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{student.name}</span>
                {!student.active && (
                  <span className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                    removed
                  </span>
                )}
              </div>
              <form
                action={setStudentActive.bind(null, student.id, !student.active)}
              >
                <button
                  className={`text-xs font-medium rounded-md px-3 py-1.5 border ${
                    student.active
                      ? "border-red-200 text-red-700 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                  }`}
                >
                  {student.active ? "Remove" : "Restore"}
                </button>
              </form>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-400 mt-4">
          Removing a student blocks their login and hides them from
          attendance marking, but keeps their past attendance records.
        </p>
      </div>
    </main>
  );
}
