import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  name: string;
  role: "admin" | "student";
  active: boolean;
};

/** The signed-in user's profile, or null if not logged in. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, active")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}
