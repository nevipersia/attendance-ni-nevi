import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import {
  updateSubject,
  deleteSubject,
  addScheduleSlot,
  deleteScheduleSlot,
} from "@/lib/actions/subjects";
import { DAY_NAMES } from "@/lib/constants";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/me");

  const supabase = await createClient();
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, grace_minutes, admin_id")
    .eq("id", id)
    .single();

  if (!subject || subject.admin_id !== profile.id) notFound();

  const { data: schedule } = await supabase
    .from("subject_schedule")
    .select("id, day_of_week, start_time, end_time")
    .eq("subject_id", id)
    .order("day_of_week");

  const updateSubjectWithId = updateSubject.bind(null, id);
  const deleteSubjectWithId = deleteSubject.bind(null, id);
  const addScheduleSlotWithId = addScheduleSlot.bind(null, id);

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-neutral-500 mb-6">
          <Link href="/admin/subjects" className="hover:underline">
            ← Subjects
          </Link>
        </p>

        <section className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
          <h1 className="text-lg font-semibold mb-4">Edit subject</h1>
          <form action={updateSubjectWithId} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Name
              </label>
              <input
                name="name"
                type="text"
                defaultValue={subject.name}
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Grace period (minutes, either side of the scheduled window)
              </label>
              <input
                name="grace_minutes"
                type="number"
                min={0}
                max={60}
                defaultValue={subject.grace_minutes}
                required
                className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
              />
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                className="rounded-md bg-emerald-800 text-white text-sm font-medium px-4 py-2"
              >
                Save
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
          <h2 className="text-base font-semibold mb-4">Weekly schedule</h2>

          <div className="flex flex-col gap-2 mb-4">
            {!schedule?.length && (
              <p className="text-sm text-neutral-500">No sessions scheduled yet.</p>
            )}
            {schedule?.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between text-sm border border-neutral-100 rounded-md px-3 py-2"
              >
                <span>
                  {DAY_NAMES[slot.day_of_week]} · {slot.start_time.slice(0, 5)}–
                  {slot.end_time.slice(0, 5)}
                </span>
                <form action={deleteScheduleSlot.bind(null, id, slot.id)}>
                  <button className="text-xs text-red-700 hover:underline">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>

          <form
            action={addScheduleSlotWithId}
            className="flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-4"
          >
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Day
              </label>
              <select
                name="day_of_week"
                defaultValue="1"
                className="rounded-md border border-neutral-300 px-2 py-2 text-sm bg-white"
              >
                {DAY_NAMES.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Start
              </label>
              <input
                name="start_time"
                type="time"
                required
                className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                End
              </label>
              <input
                name="end_time"
                type="time"
                required
                className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-800 text-white text-sm font-medium px-4 py-2"
            >
              Add slot
            </button>
          </form>
        </section>

        <form action={deleteSubjectWithId}>
          <button className="text-sm text-red-700 hover:underline">
            Delete subject
          </button>
        </form>
      </div>
    </main>
  );
}
