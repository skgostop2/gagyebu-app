/** 변경이력 화면 공용 라벨 (9단계, 요구사항: 수정·삭제 이력) */

export const AUDIT_TABLE_LABEL: Record<string, string> = {
  transactions: "거래",
  budgets: "예산",
  cards: "카드",
  card_transactions: "카드 사용내역",
  maintenance_fees: "관리비",
  savings_accounts: "저축",
  investments: "투자",
  assets: "자산",
  liabilities: "부채",
  income_scenarios: "미래수입 시나리오",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  insert: "등록",
  update: "수정",
  delete: "삭제",
};
