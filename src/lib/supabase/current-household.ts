import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export async function getCurrentMembership(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ householdId: string; role: string } | null> {
  const { data } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { householdId: data.household_id, role: data.role };
}
