/** 저축·투자·자산·부채 화면 공용 라벨/계산 헬퍼 (요구사항 24~28, 6단계) */

export const INVESTMENT_TYPES = [
  "domestic_stock",
  "foreign_stock",
  "etf",
  "fund",
  "bond",
  "pension_savings",
  "retirement_pension",
  "crypto",
  "other",
] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const INVESTMENT_TYPE_LABEL: Record<InvestmentType, string> = {
  domestic_stock: "국내주식",
  foreign_stock: "해외주식",
  etf: "ETF",
  fund: "펀드",
  bond: "채권",
  pension_savings: "연금저축",
  retirement_pension: "퇴직연금",
  crypto: "가상자산",
  other: "기타",
};

export const ASSET_CATEGORIES = ["cash_equivalent", "investment", "real_asset"] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_CATEGORY_LABEL: Record<AssetCategory, string> = {
  cash_equivalent: "현금성 자산",
  investment: "투자성 자산",
  real_asset: "실물 자산",
};

export const ASSET_KINDS_BY_CATEGORY: Record<AssetCategory, { value: string; label: string }[]> = {
  cash_equivalent: [
    { value: "cash", label: "현금" },
    { value: "checking_account", label: "입출금계좌" },
    { value: "deposit", label: "예금" },
    { value: "installment_savings", label: "적금" },
    { value: "emergency_fund", label: "비상금" },
    { value: "housing_subscription", label: "주택청약" },
  ],
  investment: [
    { value: "domestic_stock", label: "국내주식" },
    { value: "foreign_stock", label: "해외주식" },
    { value: "etf", label: "ETF" },
    { value: "fund", label: "펀드" },
    { value: "bond", label: "채권" },
    { value: "pension_savings", label: "연금저축" },
    { value: "retirement_pension", label: "퇴직연금" },
    { value: "crypto", label: "가상자산" },
  ],
  real_asset: [
    { value: "apartment", label: "아파트" },
    { value: "house", label: "주택" },
    { value: "land", label: "토지" },
    { value: "vehicle", label: "차량" },
    { value: "precious_metal", label: "귀금속" },
    { value: "other", label: "기타" },
  ],
};

export const ASSET_KIND_LABEL: Record<string, string> = Object.values(ASSET_KINDS_BY_CATEGORY)
  .flat()
  .reduce((acc, k) => ({ ...acc, [k.value]: k.label }), {} as Record<string, string>);

export const LIABILITY_KINDS = [
  "mortgage",
  "jeonse_loan",
  "credit_loan",
  "auto_installment",
  "card_installment",
  "student_loan",
  "family_loan",
  "other",
] as const;
export type LiabilityKind = (typeof LIABILITY_KINDS)[number];

export const LIABILITY_KIND_LABEL: Record<LiabilityKind, string> = {
  mortgage: "주택담보대출",
  jeonse_loan: "전세자금대출",
  credit_loan: "신용대출",
  auto_installment: "자동차할부",
  card_installment: "카드할부",
  student_loan: "학자금대출",
  family_loan: "가족간대출",
  other: "기타",
};

/** 저축목표 달성률(%) — 목표금액 미설정 시 null */
export function savingsGoalRate(currentBalance: number, targetAmount: number | null): number | null {
  if (!targetAmount || targetAmount <= 0) return null;
  return Math.min(100, (currentBalance / targetAmount) * 100);
}

/** 투자 손익(금액, 수익률%) */
export function investmentGain(principal: number, currentValuation: number): { amount: number; rate: number } {
  const amount = currentValuation - principal;
  const rate = principal > 0 ? (amount / principal) * 100 : 0;
  return { amount, rate };
}
