import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { TransactionForm } from "@/components/transactions/TransactionForm";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) redirect("/household/new");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", membership.householdId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-text-primary">거래 등록</h1>
      <TransactionForm
        householdId={membership.householdId}
        categories={categories ?? []}
        mode="create"
        defaultType={type === "income" ? "income" : undefined}
      />
    </div>
  );
}
