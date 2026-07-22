/**
 * 1단계 화면 시연용 mock 데이터.
 * 실제 데이터가 아님을 명확히 하기 위해 이 모듈 전체를 2단계 이후 샘플데이터 기능(요구사항 54)과
 * 연결하거나, DB 연동 시점에 이 파일 대신 실제 조회 함수로 교체한다.
 */
import type {
  Household,
  HouseholdMember,
  Transaction,
  RuleBasedRecommendation,
} from "@/lib/types";

export const mockHousehold: Household = {
  id: "h-mock-1",
  name: "우리 가족",
  type: "with_children",
  representativeMemberId: "m-1",
  memberCount: 4,
  currency: "KRW",
  fiscalMonthStartDay: 1,
  ownerUserId: "u-1",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  deletedAt: null,
};

export const mockMembers: HouseholdMember[] = [
  { id: "m-1", householdId: "h-mock-1", userId: "u-1", displayName: "아빠", role: "owner", joinedAt: "2026-01-01", status: "active" },
  { id: "m-2", householdId: "h-mock-1", userId: "u-2", displayName: "엄마", role: "admin", joinedAt: "2026-01-01", status: "active" },
  { id: "m-3", householdId: "h-mock-1", userId: "u-3", displayName: "첫째", role: "member", joinedAt: "2026-01-01", status: "active" },
];

function baseTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    household_id: "h-mock-1",
    created_by: "u-1",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    deleted_at: null,
    status: "active",
    type: "income",
    amount: 0,
    occurredAt: "2026-07-01",
    categoryId: null,
    actualUser: { type: "household" },
    isFixed: false,
    isEssential: false,
    isRecurringInstance: false,
    recurringTransactionId: null,
    linkedCardTransactionId: null,
    linkedSavingsAccountId: null,
    linkedLiabilityId: null,
    memo: null,
    ...overrides,
  };
}

export const mockTransactions: Transaction[] = [
  baseTx({ type: "income", amount: 4_800_000, occurredAt: "2026-07-05", memo: "월급 (아빠)" }),
  baseTx({ type: "income", amount: 2_200_000, occurredAt: "2026-07-05", memo: "월급 (엄마)" }),
  baseTx({ type: "living_expense", amount: 1_200_000, occurredAt: "2026-07-10", isFixed: true, isEssential: true, memo: "주거비" }),
  baseTx({ type: "living_expense", amount: 850_000, occurredAt: "2026-07-15", isFixed: false, isEssential: true, memo: "식비" }),
  baseTx({ type: "living_expense", amount: 320_000, occurredAt: "2026-07-16", isFixed: false, isEssential: false, memo: "외식비" }),
  baseTx({ type: "debt_interest", amount: 280_000, occurredAt: "2026-07-20", isEssential: true, memo: "주택담보대출 이자" }),
  baseTx({ type: "debt_principal", amount: 700_000, occurredAt: "2026-07-20", memo: "주택담보대출 원금" }),
  baseTx({ type: "saving", amount: 600_000, occurredAt: "2026-07-25", memo: "적금" }),
  baseTx({ type: "investment", amount: 400_000, occurredAt: "2026-07-25", memo: "연금저축" }),
];

export const mockRecommendationsPreview: RuleBasedRecommendation[] = [
  {
    id: "r-1",
    code: "future_income_shortfall",
    severity: "warning",
    title: "미래수입 감소에 대비한 조정이 필요합니다",
    description: "퇴사 시나리오 기준 월 210만원 절감이 필요합니다.",
    relatedAmount: 2_100_000,
    priority: 1,
  },
  {
    id: "r-2",
    code: "emergency_fund_low",
    severity: "caution",
    title: "비상금이 목표보다 부족합니다",
    description: "현재 현금성 자산으로 약 2.4개월 유지 가능합니다.",
    relatedAmount: 3_000_000,
    priority: 6,
  },
  {
    id: "r-3",
    code: "budget_exceeded",
    severity: "info",
    title: "외식비가 예산의 90%를 넘었습니다",
    description: "이번 달 남은 기간 외식비 조정을 고려해 보세요.",
    relatedAmount: 320_000,
    priority: 4,
  },
];

export const mockMonthlyTrend = [
  { month: "2월", income: 6_500_000, expense: 5_100_000 },
  { month: "3월", income: 6_800_000, expense: 5_400_000 },
  { month: "4월", income: 6_500_000, expense: 5_900_000 },
  { month: "5월", income: 7_000_000, expense: 5_300_000 },
  { month: "6월", income: 7_000_000, expense: 5_600_000 },
  { month: "7월", income: 7_000_000, expense: 5_750_000 },
];
