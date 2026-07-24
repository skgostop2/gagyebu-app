import Link from "next/link";
import { CreditCard, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CardForm } from "@/components/cards/CardForm";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { CARD_TYPE_LABEL, currentYearMonth, isDueInMonth, monthlyDueAmount } from "@/lib/card-labels";
import { formatKRW } from "@/lib/utils";

/** 카드 목록 + 등록 (요구사항 20, 21) */
export default async function CardsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const currentMonth = currentYearMonth();

  const [{ data: cards }, { data: members }, { data: dueTx }] = await Promise.all([
    supabase
      .from("cards")
      .select("*")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("household_members")
      .select("*")
      .eq("household_id", membership.householdId)
      .eq("status", "active"),
    supabase
      .from("card_transactions")
      .select("card_id, amount, installment_months, monthly_fee, billing_month")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .lte("billing_month", currentMonth),
  ]);

  const dueByCard = new Map<string, number>();
  for (const t of dueTx ?? []) {
    if (!isDueInMonth(t.billing_month, t.installment_months, currentMonth)) continue;
    const due = monthlyDueAmount(t.amount, t.installment_months, t.monthly_fee);
    dueByCard.set(t.card_id, (dueByCard.get(t.card_id) ?? 0) + due);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">카드</h1>
        <p className="mt-1 text-sm text-text-secondary">카드를 등록하고 사용내역·할부를 관리합니다.</p>
      </div>

      <Card className="p-0">
        {!cards || cards.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">등록된 카드가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {cards.map((c) => (
              <li key={c.id}>
                <Link href={`/cards/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover">
                  <div className="flex items-center gap-3 min-w-0">
                    <CreditCard size={18} className="shrink-0 text-text-muted" />
                    <div className="min-w-0">
                      <div className="truncate text-sm text-text-primary">
                        {c.alias} <span className="text-text-muted">· {c.issuer} {c.last4}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {CARD_TYPE_LABEL[c.card_type]} · 매월 {c.billing_day}일 결제
                        {c.is_shared ? " · 공동" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-text-primary">{formatKRW(dueByCard.get(c.id) ?? 0)}</div>
                      <div className="text-xs text-text-muted">이번 달 청구예정</div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">카드 등록</h2>
        <p className="mb-3 text-xs text-text-muted">
          카드 전체번호·CVC·비밀번호는 입력받지 않습니다. 카드 뒤 4자리만 저장합니다.
        </p>
        <CardForm householdId={membership.householdId} members={members ?? []} />
      </Card>
    </div>
  );
}
