export const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  income: "수입",
  living_expense: "생활지출",
  saving: "저축",
  investment: "투자",
  transfer: "계좌·자산 간 이동",
  debt_principal: "부채 원금상환",
  debt_interest: "대출이자",
  refund: "환급",
  card_settlement: "카드대금 정산",
};

export const SELECTABLE_TRANSACTION_TYPES = [
  "income",
  "living_expense",
  "saving",
  "investment",
  "debt_principal",
  "debt_interest",
] as const;

export type SelectableTransactionType = (typeof SELECTABLE_TRANSACTION_TYPES)[number];

export function usesCategory(type: string): type is "income" | "living_expense" {
  return type === "income" || type === "living_expense";
}

export function categoryKindOf(type: "income" | "living_expense"): "income" | "expense" {
  return type === "income" ? "income" : "expense";
}
