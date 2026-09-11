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

export async function setStudentActive(studentId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ active })
    .eq("id", studentId)
    .eq("role", "student");

  revalidatePath("/admin/students");
  revalidatePath("/admin/sessions");
}
