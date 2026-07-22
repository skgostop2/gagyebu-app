import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResponsiveShell } from "@/components/layout/ResponsiveShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (!memberships || memberships.length === 0) {
    redirect("/household/new");
  }

  return <ResponsiveShell>{children}</ResponsiveShell>;
}
