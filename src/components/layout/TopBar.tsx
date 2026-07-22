import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/** 태블릿·PC에서 표시되는 상단 바 — 로그인한 사용자의 실제 가정 이름과 읽지 않은 알림 수를 표시한다 */
export async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let householdName = "";
  let unreadCount = 0;
  if (user) {
    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membership) {
      const { data: household } = await supabase
        .from("households")
        .select("name")
        .eq("id", membership.household_id)
        .single();
      householdName = household?.name ?? "";

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("household_id", membership.household_id)
        .eq("is_read", false);
      unreadCount = count ?? 0;
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur md:px-6 print:hidden">
      <div className="text-sm text-text-secondary">
        <span className="font-medium text-text-primary">{householdName}</span>
        <span className="ml-2 text-text-muted">가계부</span>
      </div>
      <Link
        href="/notifications"
        aria-label={unreadCount > 0 ? `알림 (읽지 않음 ${unreadCount}건)` : "알림"}
        className="relative touch-target flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}
