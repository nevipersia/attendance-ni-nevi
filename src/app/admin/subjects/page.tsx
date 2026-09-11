import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { createSubject } from "@/lib/actions/subjects";

export default async function SubjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/me");

  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, grace_minutes")
    .eq("admin_id", profile.id)
    .order("name");

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">Subjects</h1>
            <p className="text-sm text-neutral-500">
              <Link href="/admin" className="hover:underline">
                ← Today
              </Link>
            </p>
          </div>
        </div>

        <form
          action={createSubject}
          className="flex gap-2 mb-6 bg-white border border-neutral-200 rounded-lg p-3"
        >
          <input
            name="name"
            type="text"
            required
            placeholder="New subject name (e.g. Algebra II)"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-800 text-white text-sm font-medium px-4"
          >
            Add
          </button>
        </form>

        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
          {!subjects?.length && (
            <p className="p-4 text-sm text-neutral-500">No subjects yet.</p>
          )}
          {subjects?.map((s) => (
            <Link
              key={s.id}
              href={`/admin/subjects/${s.id}`}
              className="flex items-center justify-between p-4 hover:bg-neutral-50"
            >
              <span className="text-sm font-medium">{s.name}</span>
              <span className="text-xs text-neutral-400">
                {s.grace_minutes}m grace →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
