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

export async function markAttendance(
  sessionId: string,
  studentId: string,
  status: "present" | "late" | "absent",
) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("attendance")
    .upsert(
      { session_id: sessionId, student_id: studentId, status, method: "manual" },
      { onConflict: "session_id,student_id" },
    );

  revalidatePath(`/admin/sessions/${sessionId}/mark`);
  revalidatePath("/admin");
}

export async function clearAttendance(sessionId: string, studentId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("attendance")
    .delete()
    .eq("session_id", sessionId)
    .eq("student_id", studentId);

  revalidatePath(`/admin/sessions/${sessionId}/mark`);
  revalidatePath("/admin");
}
