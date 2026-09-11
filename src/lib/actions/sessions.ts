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
