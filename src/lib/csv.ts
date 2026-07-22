/** 거래 CSV 가져오기/내보내기 공용 헬퍼 (13단계) — 클라이언트·서버 모두에서 사용 가능 */

export const TRANSACTION_CSV_HEADERS = ["유형", "금액", "일시", "카테고리", "고정지출", "필수지출", "메모"] as const;

export interface TransactionCsvRow {
  type: string;
  amount: number;
  occurredAt: string;
  categoryName: string;
  isFixed: boolean;
  isEssential: boolean;
  memo: string;
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: TransactionCsvRow[]): string {
  const lines = [TRANSACTION_CSV_HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.type,
        String(r.amount),
        r.occurredAt,
        r.categoryName,
        r.isFixed ? "Y" : "N",
        r.isEssential ? "Y" : "N",
        r.memo,
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  }
  return "﻿" + lines.join("\r\n"); // BOM 포함 — 엑셀에서 한글 깨짐 방지
}

/** 아주 단순한 CSV 파서 — 쉼표/따옴표 이스케이프만 지원(우리 자체 내보내기 형식과 동일한 파일을 가정) */
export function parseCsv(text: string): string[][] {
  const cleaned = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
