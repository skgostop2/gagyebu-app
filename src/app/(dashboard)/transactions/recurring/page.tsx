import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { RecurringForm } from "@/components/transactions/RecurringForm";
import { GenerateRecurringButton } from "@/components/transactions/GenerateRecurringButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { TRANSACTION_TYPE_LABEL } from "@/lib/transaction-labels";
import { formatKRW } from "@/lib/utils";

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  yearly: "매년",
  custom: "사용자 지정",
};

export default async function RecurringTransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) redirect("/household/new");

  const [{ data: recurring }, { data: categories }] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select("*, category:categories(name)")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  const canManage = membership.role === "owner" || membership.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">반복거래</h1>
        <p className="mt-1 text-sm text-text-secondary">
          월급, 보험료, 통신비, 관리비 같은 고정 항목을 등록해두면 매달 버튼 한 번으로 생성할 수 있습니다.
        </p>
      </div>

      <GenerateRecurringButton householdId={membership.householdId} />

      <Card className="p-0">
        {!recurring || recurring.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">등록된 반복거래가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recurring.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{r.memo || TRANSACTION_TYPE_LABEL[r.template_type]}</span>
                  <span className="text-sm font-medium text-text-primary">{formatKRW(r.amount)}</span>
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  {TRANSACTION_TYPE_LABEL[r.template_type]} · {FREQUENCY_LABEL[r.frequency]}
                  {r.category?.name ? ` · ${r.category.name}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canManage ? (
        <Card>
          <h2 className="mb-3 text-sm font-medium text-text-primary">새 반복거래 등록</h2>
          <RecurringForm householdId={membership.householdId} categories={categories ?? []} />
        </Card>
      ) : (
        <p className="text-center text-xs text-text-muted">반복거래 등록은 관리자 이상만 가능합니다.</p>
      )}
    </div>
  );
}
