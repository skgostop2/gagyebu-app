import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CardTransactionForm } from "@/components/cards/CardTransactionForm";
import { DeleteCardTransactionButton } from "@/components/cards/DeleteCardTransactionButton";
import { DeleteCardButton } from "@/components/cards/DeleteCardButton";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { CARD_TYPE_LABEL, currentYearMonth, isDueInMonth, monthlyDueAmount } from "@/lib/card-labels";
import { formatKRW, formatDateShortKo } from "@/lib/utils";

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const [{ data: cardRow }, { data: categories }, { data: members }, { data: transactions }] = await Promise.all([
    supabase.from("cards").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase.from("household_members").select("*").eq("household_id", membership.householdId).eq("status", "active"),
    supabase
      .from("card_transactions")
      .select("*, category:categories(name)")
      .eq("card_id", id)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(50),
  ]);

  if (!cardRow) notFound();

  const currentMonth = currentYearMonth();
  const thisMonthDue = (transactions ?? [])
    .filter((t) => isDueInMonth(t.billing_month, t.installment_months, currentMonth))
    .reduce((acc, t) => acc + monthlyDueAmount(t.amount, t.installment_months, t.monthly_fee), 0);

  const canManageAll = membership.role === "owner" || membership.role === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/cards" className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ChevronLeft size={16} /> 카드 목록
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {cardRow.alias} <span className="text-text-muted">· {cardRow.issuer} {cardRow.last4}</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {CARD_TYPE_LABEL[cardRow.card_type]} · 매월 {cardRow.billing_day}일 결제
            {cardRow.monthly_limit ? ` · 한도 ${formatKRW(cardRow.monthly_limit)}` : ""}
          </p>
        </div>
        <DeleteCardButton cardId={cardRow.id} />
      </div>

      <Card>
        <div className="text-sm text-text-secondary">이번 달 청구예정액</div>
        <div className="mt-1 text-2xl font-semibold text-text-primary">{formatKRW(thisMonthDue)}</div>
        <p className="mt-1 text-xs text-text-muted">
          카드 결제일 기준 추정값입니다. 할부 구간에 걸친 거래는 이번 달 회차 금액만 반영됩니다.
        </p>
      </Card>

      <Card className="p-0">
        {!transactions || transactions.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">등록된 사용내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => {
              const canEdit = canManageAll || t.created_by === user!.id;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-text-primary">{t.merchant}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                      <span>{formatDateShortKo(t.occurred_at)}</span>
                      {t.category?.name && (
                        <>
                          <span>·</span>
                          <span>{t.category.name}</span>
                        </>
                      )}
                      {t.is_installment && (
                        <>
                          <span>·</span>
                          <span>{t.installment_months}개월 할부</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{t.billing_month} 청구 시작</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium text-text-primary">{formatKRW(t.amount)}</span>
                    {canEdit && <DeleteCardTransactionButton cardTransactionId={t.id} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">사용내역 등록</h2>
        <CardTransactionForm
          householdId={membership.householdId}
          cardId={cardRow.id}
          billingDay={cardRow.billing_day}
          categories={categories ?? []}
          members={members ?? []}
        />
      </Card>
    </div>
  );
}
