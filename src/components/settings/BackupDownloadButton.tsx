"use client";

import { useState } from "react";
import { HardDriveDownload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { downloadTextFile } from "@/lib/csv";

const BACKUP_TABLES = [
  "categories",
  "transactions",
  "recurring_transactions",
  "cards",
  "card_transactions",
  "maintenance_fees",
  "maintenance_fee_items",
  "budgets",
  "savings_accounts",
  "investments",
  "assets",
  "liabilities",
  "income_scenarios",
  "asset_snapshots",
  "monthly_closings",
] as const;

/**
 * 전체 데이터 백업 다운로드 (13단계, 요구사항: 백업·복원)
 * 가정의 주요 테이블 전체를 하나의 JSON 파일로 내려받는다.
 * 복원(가져오기)은 거래내역만 CSV로 지원한다 — 여러 테이블 간 참조관계까지 통째로 복원하는 기능은
 * 데이터 정합성 위험이 있어 이후 단계 과제로 남겨둔다. 이 파일은 보관·이전용 백업으로 사용한다.
 */
export function BackupDownloadButton({ householdId }: { householdId: string }) {
  const [loading, setLoading] = useState(false);

  const onDownload = async () => {
    setLoading(true);
    const supabase = createClient();

    const results = await Promise.all(
      BACKUP_TABLES.map((table) => supabase.from(table).select("*").eq("household_id", householdId))
    );

    const backup: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      householdId,
      version: 1,
    };
    BACKUP_TABLES.forEach((table, i) => {
      backup[table] = results[i]?.data ?? [];
    });

    const today = new Date().toISOString().slice(0, 10);
    downloadTextFile(`가계부_백업_${today}.json`, JSON.stringify(backup, null, 2), "application/json");
    setLoading(false);
  };

  return (
    <Button variant="secondary" onClick={onDownload} disabled={loading}>
      <HardDriveDownload size={16} /> {loading ? "백업 생성 중..." : "전체 데이터 백업(JSON) 다운로드"}
    </Button>
  );
}
