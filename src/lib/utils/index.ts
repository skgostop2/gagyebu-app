/** 원화 표시 (요구사항 12) */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** 부호 포함 원화 표시 (+123,000원 / -45,000원) */
export function formatKRWSigned(amount: number): string {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${formatKRW(amount)}`;
}

/** 한국식 날짜 표시 (요구사항 13) — 2026년 7월 21일 */
export function formatDateKo(dateIso: string): string {
  const d = new Date(dateIso);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/** 짧은 한국식 날짜 (2026.07.21) */
export function formatDateShortKo(dateIso: string): string {
  const d = new Date(dateIso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 퍼센트 표시 */
export function formatPercent(rate: number, digits = 1): string {
  return `${rate.toFixed(digits)}%`;
}

/** 클래스명 조합 헬퍼 (중복 라이브러리 방지를 위해 clsx 대신 직접 구현) */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
