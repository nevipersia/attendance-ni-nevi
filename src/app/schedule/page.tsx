import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { DAY_NAMES } from "@/lib/constants";

type ScheduleRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  subjects: { name: string } | null;
};

export default async function SchedulePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("subject_schedule")
    .select("day_of_week, start_time, end_time, subjects(name)")
    .order("day_of_week")
    .order("start_time");

  const rows = (data ?? []) as unknown as ScheduleRow[];
  const byDay = new Map<number, ScheduleRow[]>();
  for (const row of rows) {
    const list = byDay.get(row.day_of_week) ?? [];
    list.push(row);
    byDay.set(row.day_of_week, list);
  }

  const backHref = profile.role === "admin" ? "/admin" : "/me";

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold">Weekly schedule</h1>
            <p className="text-sm text-neutral-500">
              <Link href={backHref} className="hover:underline">
                ← Back
              </Link>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAY_NAMES.map((day, i) => {
            const entries = (byDay.get(i) ?? []).sort((a, b) =>
              a.start_time.localeCompare(b.start_time),
            );
            return (
              <div
                key={day}
                className="bg-white border border-neutral-200 rounded-lg overflow-hidden"
              >
                <div className="bg-neutral-50 border-b border-neutral-200 px-3 py-2 text-xs font-mono uppercase tracking-wide text-neutral-500">
                  {day}
                </div>
                <div className="p-2 flex flex-col gap-1.5 min-h-[64px]">
                  {!entries.length && (
                    <p className="text-xs text-neutral-300 px-1 py-1">—</p>
                  )}
                  {entries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1.5"
                    >
                      <p className="text-xs font-medium text-emerald-900 leading-tight">
                        {entry.subjects?.name ?? "Unknown subject"}
                      </p>
                      <p className="text-[10px] font-mono text-emerald-700">
                        {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
