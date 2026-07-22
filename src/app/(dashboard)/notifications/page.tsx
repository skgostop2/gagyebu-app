import { Card } from "@/components/ui/Card";
import { MarkReadButton } from "@/components/notifications/MarkReadButton";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { formatDateKo } from "@/lib/utils";

/** 앱 내부 알림 목록 (9단계, 요구사항: 앱 내부 알림) — 가정 공용, 누구든 읽음 처리 가능 */
export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("household_id", membership.householdId)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">알림</h1>
          <p className="mt-1 text-sm text-text-secondary">
            예산 임계치 도달, 월마감 등 가정에 공유되는 알림입니다. {unreadCount > 0 && `읽지 않은 알림 ${unreadCount}건`}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton householdId={membership.householdId} />}
      </div>

      <Card className="p-0">
        {!notifications || notifications.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">알림이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id} className={"px-4 py-3" + (n.is_read ? "" : " bg-neon-blue/5")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" aria-hidden />}
                      <span className="text-sm font-medium text-text-primary">{n.title}</span>
                    </div>
                    {n.body && <p className="mt-0.5 text-xs text-text-secondary">{n.body}</p>}
                    <p className="mt-1 text-xs text-text-muted">{formatDateKo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <MarkReadButton notificationId={n.id} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
