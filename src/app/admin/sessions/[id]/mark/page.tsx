import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { markAttendance, clearAttendance } from "@/lib/actions/attendance";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", classes: "bg-emerald-800 text-white" },
  { value: "late", label: "Late", classes: "bg-amber-600 text-white" },
  { value: "absent", label: "Absent", classes: "bg-red-700 text-white" },
] as const;

export default async function MarkAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/me");

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, subject_id")
    .eq("id", sessionId)
    .single();
  if (!session) notFound();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, admin_id")
    .eq("id", session.subject_id)
    .single();
  if (!subject || subject.admin_id !== profile.id) notFound();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("role", "student")
    .order("name");

  const { data: attendance } = await supabase
    .from("attendance")
    .select("student_id, status, method")
    .eq("session_id", sessionId);

  const statusByStudent = new Map(attendance?.map((a) => [a.student_id, a]));

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-neutral-500 mb-1">
          <Link href="/admin" className="hover:underline">
            ← Today
          </Link>
        </p>
        <h1 className="text-lg font-semibold mb-6">Mark attendance · {subject.name}</h1>

        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
          {!students?.length && (
            <p className="p-4 text-sm text-neutral-500">No students yet.</p>
          )}
          {students?.map((student) => {
            const current = statusByStudent.get(student.id);
            return (
              <div key={student.id} className="flex items-center justify-between p-4 gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium">{student.name}</p>
                  {current && (
                    <p className="text-[11px] font-mono text-neutral-400">
                      via {current.method}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = current?.status === opt.value;
                    return (
                      <form
                        key={opt.value}
                        action={markAttendance.bind(null, sessionId, student.id, opt.value)}
                      >
                        <button
                          className={`text-xs font-medium rounded-md px-3 py-1.5 border ${
                            active
                              ? opt.classes + " border-transparent"
                              : "bg-white text-neutral-600 border-neutral-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      </form>
                    );
                  })}
                  {current && (
                    <form action={clearAttendance.bind(null, sessionId, student.id)}>
                      <button className="text-xs text-neutral-400 hover:text-neutral-700 px-2">
                        Clear
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
