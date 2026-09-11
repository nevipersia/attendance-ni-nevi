import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { signOut } from "@/lib/actions/auth";

export default async function StudentPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/admin");

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
        <p className="text-sm text-neutral-500">
          Your attendance tallies per subject land here next.
        </p>
      </div>
    </main>
  );
}
