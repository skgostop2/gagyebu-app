"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { parseCsv, TRANSACTION_CSV_HEADERS } from "@/lib/csv";
import { TRANSACTION_TYPE_LABEL, SELECTABLE_TRANSACTION_TYPES, usesCategory, categoryKindOf } from "@/lib/transaction-labels";

const LABEL_TO_TYPE = Object.fromEntries(
  SELECTABLE_TRANSACTION_TYPES.map((t) => [TRANSACTION_TYPE_LABEL[t], t])
) as Record<string, (typeof SELECTABLE_TRANSACTION_TYPES)[number]>;

interface ImportSummary {
  inserted: number;
  skipped: number;
  skippedReasons: string[];
}

/**
 * 거래 CSV 가져오기 (13단계, 요구사항: CSV 가져오기 / 백업 복원)
 * 이 앱에서 내보낸 CSV와 같은 형식만 지원한다 — 은행/카드사 원본 CSV 형식 매핑은 다음 단계 과제로 남겨둔다.
 * 모두 새 거래로 추가되며(추가형), 중복 여부는 확인하지 않으므로 같은 파일을 두 번 가져오면 중복 등록될 수 있다.
 */
export function ImportTransactionsForm({ householdId }: { householdId: string }) {
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSummary(null);
    setImporting(true);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setError("빈 파일입니다.");
        setImporting(false);
        return;
      }

      const header = rows[0];
      const isValidHeader =
        header && header.length >= TRANSACTION_CSV_HEADERS.length && header[0] === TRANSACTION_CSV_HEADERS[0];
      if (!isValidHeader) {
        setError("이 앱에서 내보낸 거래내역 CSV 형식이 아닙니다. (헤더가 다릅니다)");
        setImporting(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("로그인이 필요합니다.");
        setImporting(false);
        return;
      }

      const { data: categories } = await supabase
        .from("categories")
        .select("id, name, kind")
        .eq("household_id", householdId)
        .is("deleted_at", null);
      const categoryByNameKind = new Map((categories ?? []).map((c) => [`${c.kind}:${c.name}`, c.id]));

      let inserted = 0;
      let skipped = 0;
      const skippedReasons: string[] = [];

      for (const cols of rows.slice(1)) {
        const [typeLabel, amountStr, occurredAt, categoryName, isFixedStr, isEssentialStr, memo] = cols;
        const type = typeLabel ? LABEL_TO_TYPE[typeLabel] : undefined;
        const amount = Number(amountStr);

        if (!type || !amount || amount <= 0 || !occurredAt) {
          skipped++;
          if (skippedReasons.length < 5) skippedReasons.push(`"${typeLabel ?? ""}" 행을 확인해 주세요.`);
          continue;
        }

        let categoryId: string | null = null;
        if (usesCategory(type) && categoryName) {
          categoryId = categoryByNameKind.get(`${categoryKindOf(type)}:${categoryName}`) ?? null;
        }

        const { error: insertError } = await supabase.from("transactions").insert({
          household_id: householdId,
          type,
          amount,
          occurred_at: new Date(occurredAt).toISOString(),
          category_id: categoryId,
          is_fixed: isFixedStr === "Y",
          is_essential: isEssentialStr === "Y",
          memo: memo || null,
          created_by: user.id,
        });

        if (insertError) {
          skipped++;
        } else {
          inserted++;
        }
      }

      setSummary({ inserted, skipped, skippedReasons });
    } catch {
      setError("파일을 읽는 중 문제가 발생했습니다.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <label className="inline-flex cursor-pointer">
        <span
          className={
            "touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-hover " +
            (importing ? "cursor-not-allowed opacity-50" : "")
          }
        >
          <Upload size={16} /> {importing ? "가져오는 중..." : "거래내역 CSV 가져오기"}
        </span>
        <input type="file" accept=".csv,text/csv" className="hidden" disabled={importing} onChange={onFileChange} />
      </label>

      {error && <p className="mt-2 text-sm text-status-danger">{error}</p>}
      {summary && (
        <div className="mt-2 text-sm text-text-secondary">
          <p>
            {summary.inserted}건 등록 완료
            {summary.skipped > 0 && `, ${summary.skipped}건 건너뜀`}
          </p>
          {summary.skippedReasons.map((r, i) => (
            <p key={i} className="text-xs text-text-muted">
              {r}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
