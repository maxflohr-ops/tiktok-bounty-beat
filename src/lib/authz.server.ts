import type { SupabaseClient } from "@supabase/supabase-js";

export async function isStaff(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "manager"])
    .limit(1);
  return !!(data && data.length > 0);
}

export async function hasRole(
  supabase: SupabaseClient,
  userId: string,
  role: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .limit(1);
  return !!(data && data.length > 0);
}
