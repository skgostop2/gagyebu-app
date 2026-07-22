/** 카드·관리비 화면 공용 라벨/계산 헬퍼 (요구사항 20, 21, 22, 4단계) */

export const CARD_TYPE_LABEL: Record<string, string> = {
  credit: "신용카드",
  check: "체크카드",
};

export const MAINTENANCE_FEE_ITEM_KINDS = [
  "general_management",
  "cleaning",
  "security",
  "elevator",
  "common_electricity",
  "unit_electricity",
  "water",
  "hot_water",
  "heating",
  "gas",
  "parking",
  "long_term_repair_reserve",
  "repair_maintenance",
  "food_waste",
  "other",
] as const;

export type MaintenanceFeeItemKind = (typeof MAINTENANCE_FEE_ITEM_KINDS)[number];

export const MAINTENANCE_FEE_ITEM_LABEL: Record<MaintenanceFeeItemKind, string> = {
  general_management: "일반관리비",
  cleaning: "청소비",
  security: "경비비",
  elevator: "승강기유지비",
  common_electricity: "공용전기료",
  unit_electricity: "세대전기료",
  water: "수도료",
  hot_water: "급탕비",
  heating: "난방비",
  gas: "가스비",
  parking: "주차비",
  long_term_repair_reserve: "장기수선충당금",
  repair_maintenance: "수선유지비",
  food_waste: "음식물쓰레기",
  other: "기타",
};

/** 현재(로컬 기준) YYYY-MM */
export function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** YYYY-MM에 개월수를 더한 YYYY-MM */
export function addMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const total = (y as number) * 12 + ((m as number) - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/**
 * 카드 이용일과 카드 결제일(billingDay)로 최초 청구월을 추정한다.
 * 이용일이 결제일 이전(또는 같은 날)이면 이용월에 청구, 이후면 다음 달에 청구되는 것으로 단순화한다.
 * 카드사마다 매입마감일 기준이 달라 정확하지 않을 수 있어 사용자가 직접 수정할 수 있게 한다.
 */
export function estimateBillingMonth(occurredAtIso: string, billingDay: number): string {
  const d = new Date(occurredAtIso);
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return d.getDate() <= billingDay ? ym : addMonths(ym, 1);
}

/** 해당 카드거래가 targetMonth에 청구되는지 (할부 구간 포함) */
export function isDueInMonth(billingMonth: string, installmentMonths: number, targetMonth: string): boolean {
  const endMonth = addMonths(billingMonth, Math.max(0, installmentMonths - 1));
  return billingMonth <= targetMonth && targetMonth <= endMonth;
}

/** targetMonth에 청구되는 이번 회차 금액 (할부면 원금/개월 + 월수수료) */
export function monthlyDueAmount(amount: number, installmentMonths: number, monthlyFee: number): number {
  if (installmentMonths <= 1) return amount;
  return Math.round(amount / installmentMonths) + monthlyFee;
}
