"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");
  return profile;
}

export async function updateSessionTime(sessionId: string, formData: FormData) {
  await requireAdmin();
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  if (!startTime || !endTime) return;

  const supabase = await createClient();
  await supabase.rpc("update_session_local_time", {
    p_session_id: sessionId,
    p_start_time: startTime,
    p_end_time: endTime,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/sessions/${sessionId}/qr`);
  redirect("/admin");
}

/**
 * Deletes today's session outright (cascades any attendance already
 * recorded for it). Leaves the subject's regular weekly schedule
 * untouched -- tomorrow's cron run creates a fresh session as usual.
 */
export async function cancelSession(sessionId: string) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, subjects!inner ( admin_id )")
    .eq("id", sessionId)
    .single();

  const subject = session
    ? Array.isArray(session.subjects)
      ? session.subjects[0]
      : session.subjects
    : null;
  if (!session || !subject || subject.admin_id !== profile.id) {
    redirect("/admin");
  }

  await supabase.from("sessions").delete().eq("id", sessionId);
  revalidatePath("/admin");
  redirect("/admin");
}
