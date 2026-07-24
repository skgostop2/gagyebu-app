import Link from "next/link";
import { Plus, Pencil, Repeat, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteTransactionButton } from "@/components/transactions/DeleteTransactionButton";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { TRANSACTION_TYPE_LABEL } from "@/lib/transaction-labels";
import { formatKRW, formatDateShortKo } from "@/lib/utils";

/**
 * 수입·지출 목록 (요구사항 18, 19) — 실제 DB와 연동됨.
 * 검색·필터·기간조회·페이지네이션은 이후 단계에서 고도화한다. 지금은 최근 50건을 보여준다.
 */
export default async function TransactionsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;

  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, category:categories(name), transaction_attachments(id)")
    .eq("household_id", membership.householdId)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(50);

  const canManageAll = membership.role === "owner" || membership.role === "admin";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">수입·지출</h1>
        <div className="flex items-center gap-2">
          <Link href="/transactions/recurring">
            <Button variant="secondary">
              <Repeat size={16} /> 반복거래
            </Button>
          </Link>
          <Link href="/transactions/new">
            <Button variant="primary">
              <Plus size={16} /> 거래 등록
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-0">
        {!transactions || transactions.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">
            아직 등록된 거래가 없습니다. &quot;거래 등록&quot;으로 첫 거래를 추가해 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => {
              const canEdit = canManageAll || t.created_by === user!.id;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-text-primary">
                      {t.memo || t.category?.name || TRANSACTION_TYPE_LABEL[t.type]}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                      <span>{formatDateShortKo(t.occurred_at)}</span>
                      <span>·</span>
                      <span>{TRANSACTION_TYPE_LABEL[t.type]}</span>
                      {t.category?.name && (
                        <>
                          <span>·</span>
                          <span>{t.category.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {t.transaction_attachments && t.transaction_attachments.length > 0 && (
                      <a
                        href={`/api/receipts/${t.transaction_attachments[0]!.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="touch-target flex items-center text-text-muted hover:text-cyan"
                        title="영수증 보기"
                        aria-label="영수증 보기"
                      >
                        <Paperclip size={14} />
                      </a>
                    )}
                    <span
                      className={
                        t.type === "income"
                          ? "text-sm font-medium text-status-stable"
                          : "text-sm font-medium text-text-primary"
                      }
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatKRW(t.amount)}
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/transactions/${t.id}/edit`}
                          className="touch-target flex items-center gap-1 rounded-lg px-2 text-xs text-text-muted hover:text-text-primary"
                        >
                          <Pencil size={14} /> 수정
                        </Link>
                        <DeleteTransactionButton transactionId={t.id} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-center text-xs text-text-muted">최근 50건만 표시됩니다. 검색·기간필터는 다음 단계에서 추가됩니다.</p>
    </div>
  );
}
