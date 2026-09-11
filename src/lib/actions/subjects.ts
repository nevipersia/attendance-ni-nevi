"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }
  return profile;
}

export async function createSubject(formData: FormData) {
  const profile = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("subjects").insert({ name, admin_id: profile.id });

  revalidatePath("/admin/subjects");
}

export async function updateSubject(subjectId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const graceMinutes = Number(formData.get("grace_minutes") ?? 10);
  if (!name) return;

  const supabase = await createClient();
  await supabase
    .from("subjects")
    .update({ name, grace_minutes: graceMinutes })
    .eq("id", subjectId);

  revalidatePath("/admin/subjects");
  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function deleteSubject(subjectId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("subjects").delete().eq("id", subjectId);
  revalidatePath("/admin/subjects");
  redirect("/admin/subjects");
}

export async function addScheduleSlot(subjectId: string, formData: FormData) {
  await requireAdmin();
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");

  if (
    Number.isNaN(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6 ||
    !startTime ||
    !endTime ||
    startTime >= endTime
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("subject_schedule").insert({
    subject_id: subjectId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });

  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function updateScheduleSlot(
  subjectId: string,
  slotId: string,
  formData: FormData,
) {
  await requireAdmin();
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");

  if (
    Number.isNaN(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6 ||
    !startTime ||
    !endTime ||
    startTime >= endTime
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("subject_schedule")
    .update({ day_of_week: dayOfWeek, start_time: startTime, end_time: endTime })
    .eq("id", slotId);

  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function deleteScheduleSlot(subjectId: string, slotId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("subject_schedule").delete().eq("id", slotId);
  revalidatePath(`/admin/subjects/${subjectId}`);
}
