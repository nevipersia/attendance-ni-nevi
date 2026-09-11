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
  // getSession() reads the JWT from cookies locally instead of making
  // another network call to Supabase's auth server -- safe here because
  // middleware already called getUser() (which does verify over the
  // network and refreshes the token) earlier in this same request.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, active")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}
