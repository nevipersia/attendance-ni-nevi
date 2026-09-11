import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { updateSessionTime } from "@/lib/actions/sessions";

function toLocalTimeInput(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("hour")}:${get("minute")}`;
}

export default async function EditSessionPage({
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
    .select("id, subject_id, session_date, scheduled_start, scheduled_end")
    .eq("id", sessionId)
    .single();
  if (!session) notFound();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, admin_id")
    .eq("id", session.subject_id)
    .single();
  if (!subject || subject.admin_id !== profile.id) notFound();

  const updateWithId = updateSessionTime.bind(null, sessionId);

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-sm mx-auto">
        <p className="text-sm text-neutral-500 mb-1">
          <Link href="/admin" className="hover:underline">
            ← Today
          </Link>
        </p>
        <h1 className="text-lg font-semibold mb-1">Adjust today&rsquo;s time</h1>
        <p className="text-sm text-neutral-500 mb-6">
          {subject.name} · {session.session_date}
        </p>

        <form
          action={updateWithId}
          className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col gap-4"
        >
          <p className="text-xs text-neutral-400">
            This only changes today&rsquo;s session. The subject&rsquo;s regular
            weekly schedule is unaffected.
          </p>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Start time
            </label>
            <input
              name="start_time"
              type="time"
              required
              defaultValue={toLocalTimeInput(session.scheduled_start)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              End time
            </label>
            <input
              name="end_time"
              type="time"
              required
              defaultValue={toLocalTimeInput(session.scheduled_end)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-emerald-800 text-white text-sm font-medium px-4 py-2"
          >
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
