"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toCsv, downloadTextFile, type TransactionCsvRow } from "@/lib/csv";
import { TRANSACTION_TYPE_LABEL } from "@/lib/transaction-labels";

/** 거래 CSV 내보내기 (13단계, 요구사항: CSV·엑셀 내보내기) */
export function ExportTransactionsButton({ householdId }: { householdId: string }) {
  const [loading, setLoading] = useState(false);

  const onExport = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: transactions } = await supabase
      .from("transactions")
      .select("type, amount, occurred_at, is_fixed, is_essential, memo, category:categories(name)")
      .eq("household_id", householdId)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false });

    const rows: TransactionCsvRow[] = (transactions ?? []).map((t) => ({
      type: TRANSACTION_TYPE_LABEL[t.type] ?? t.type,
      amount: t.amount,
      occurredAt: t.occurred_at,
      categoryName: t.category?.name ?? "",
      isFixed: t.is_fixed,
      isEssential: t.is_essential,
      memo: t.memo ?? "",
    }));

    const csv = toCsv(rows);
    const today = new Date().toISOString().slice(0, 10);
    downloadTextFile(`거래내역_${today}.csv`, csv, "text/csv;charset=utf-8");
    setLoading(false);
  };

  return (
    <Button variant="secondary" onClick={onExport} disabled={loading}>
      <Download size={16} /> {loading ? "내보내는 중..." : "거래내역 CSV 내보내기"}
    </Button>
  );
}
