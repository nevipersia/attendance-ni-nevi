import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { signOut } from "@/lib/actions/auth";

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/me");

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-lg font-semibold">{profile.name}</h1>
            <p className="text-sm text-neutral-500">Admin</p>
          </div>
          <form action={signOut}>
            <button className="text-sm text-neutral-500 hover:text-neutral-800">Sign out</button>
          </form>
        </div>
        <nav className="flex gap-4 mb-8">
          <Link
            href="/admin/subjects"
            className="text-sm font-medium text-emerald-800 hover:underline"
          >
            Subjects
          </Link>
        </nav>
        <p className="text-sm text-neutral-500">
          Today&rsquo;s sessions and reports land here next.
        </p>
      </div>
    </main>
  );
}
