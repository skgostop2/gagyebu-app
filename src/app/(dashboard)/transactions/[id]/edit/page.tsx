import { notFound, redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import type { SelectableTransactionType } from "@/lib/transaction-labels";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) redirect("/household/new");

  const [{ data: tx }, { data: categories }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  if (!tx) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-text-primary">거래 수정</h1>
      <TransactionForm
        householdId={membership.householdId}
        categories={categories ?? []}
        mode="edit"
        transactionId={tx.id}
        initialValues={{
          type: tx.type as SelectableTransactionType,
          amount: tx.amount,
          occurredAt: tx.occurred_at,
          categoryId: tx.category_id,
          isFixed: tx.is_fixed,
          isEssential: tx.is_essential,
          memo: tx.memo ?? "",
        }}
      />
    </div>
  );
}
