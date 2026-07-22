/**
 * 전체 데이터 타입 정의 (요구사항 64 테이블 구조에 대응)
 *
 * 이 파일은 1단계 산출물이다. 아직 Supabase와 연결되지 않았으므로
 * 실제 테이블 스키마(RLS 정책 포함)는 2단계에서 SQL 마이그레이션으로 만들고,
 * 이 타입들은 Supabase generated types로 대체/동기화한다.
 * 지금은 화면·컴포넌트가 참조할 수 있는 형태만 먼저 확정한다.
 */

// ─────────────────────────────────────────────
// 공통
// ─────────────────────────────────────────────

/** 대부분의 테이블에 공통으로 포함되는 컬럼 (요구사항 15) */
export interface BaseEntity {
  id: string;
  household_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: EntityStatus;
}

export type EntityStatus = "active" | "inactive" | "archived";

/** 공개범위 (요구사항 29) */
export type Visibility =
  | "household" // 가족 전체 공개
  | "amount_only" // 금액만 공개
  | "owner_admin" // 소유자와 관리자만 공개
  | "owner_only"; // 소유자만 공개

/** 대상자/소유자 지정 (요구사항 16) */
export type MemberRef =
  | { type: "member"; memberId: string }
  | { type: "household" } // 가족공동
  | { type: "unassigned" }; // 미지정

// ─────────────────────────────────────────────
// 인증 / 사용자
// ─────────────────────────────────────────────

export interface UserProfile {
  id: string; // auth.users.id
  email: string;
  phone: string | null;
  phoneVerifiedAt: string | null;
  emailVerifiedAt: string | null;
  displayName: string;
  authProvider: "email" | "kakao" | "naver" | "google" | "apple"; // 초기에는 email만 사용
  createdAt: string;
}

export interface PhoneVerification {
  id: string;
  userId: string | null; // 회원가입 전에는 null
  phoneE164: string;
  codeHash: string;
  expiresAt: string;
  attemptCount: number;
  maxAttempts: number;
  status: "pending" | "verified" | "expired" | "failed";
  createdAt: string;
}

// ─────────────────────────────────────────────
// 가정 / 가족
// ─────────────────────────────────────────────

export type HouseholdType =
  | "single" // 1인 가구
  | "couple" // 부부
  | "with_children" // 자녀 포함
  | "with_parents" // 부모 포함
  | "other";

export interface Household {
  id: string;
  name: string;
  type: HouseholdType;
  representativeMemberId: string;
  memberCount: number;
  currency: "KRW";
  fiscalMonthStartDay: number; // 월 기준 시작일 (1~28)
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type HouseholdRole = "owner" | "admin" | "member" | "viewer";

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  displayName: string;
  role: HouseholdRole;
  joinedAt: string;
  status: "active" | "invited" | "removed";
}

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  code: string;
  invitedRole: HouseholdRole;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  status: "active" | "expired" | "cancelled";
  createdBy: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// 카테고리 / 거래
// ─────────────────────────────────────────────

export type CategoryKind = "income" | "expense";

export interface Category extends BaseEntity {
  kind: CategoryKind;
  name: string;
  parentId: string | null;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean; // 완전삭제 대신 비활성화 우선 (요구사항 19)
}

/** 거래유형 (요구사항 17) — 수입·지출 합계 이중계산 방지의 핵심 */
export type TransactionType =
  | "income"
  | "living_expense"
  | "saving"
  | "investment"
  | "transfer" // 계좌·자산 간 이동 — 수입·지출 합계에서 제외
  | "debt_principal" // 부채 원금상환 — 부채 감소
  | "debt_interest" // 대출이자 — 생활지출로 집계
  | "refund"
  | "card_settlement"; // 카드대금 정산 — 카드 사용내역과 중복계산 금지

export interface Transaction extends BaseEntity {
  type: TransactionType;
  amount: number; // KRW, 원 단위 정수
  occurredAt: string;
  categoryId: string | null;
  actualUser: MemberRef; // 실제 사용자/소득자
  isFixed: boolean; // 고정 or 변동
  isEssential: boolean; // 필수 or 선택
  isRecurringInstance: boolean;
  recurringTransactionId: string | null;
  linkedCardTransactionId: string | null;
  linkedSavingsAccountId: string | null;
  linkedLiabilityId: string | null;
  memo: string | null;
}

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export interface RecurringTransaction extends BaseEntity {
  templateType: TransactionType;
  amount: number;
  categoryId: string | null;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  autoCreate: boolean; // false면 생성 전 사용자 확인
  memo: string | null;
}

// ─────────────────────────────────────────────
// 카드
// ─────────────────────────────────────────────

export interface Card extends BaseEntity {
  alias: string;
  issuer: string;
  cardType: "credit" | "check";
  ownerMemberId: string;
  isShared: boolean;
  last4: string; // 카드번호 전체는 절대 저장하지 않음 (요구사항 21)
  billingDay: number;
  monthlyLimit: number | null;
  visibility: Visibility;
  memo: string | null;
}

export interface CardTransaction extends BaseEntity {
  cardId: string;
  occurredAt: string;
  amount: number;
  merchant: string;
  categoryId: string | null;
  actualUser: MemberRef;
  installment: {
    isInstallment: boolean;
    months: number; // 1이면 일시불
    monthlyPrincipal: number;
    monthlyFee: number;
    paidInstallments: number;
  };
  billingMonth: string; // YYYY-MM 결제예정월
  memo: string | null;
}

// ─────────────────────────────────────────────
// 관리비
// ─────────────────────────────────────────────

export type MaintenanceFeeItemKind =
  | "general_management"
  | "cleaning"
  | "security"
  | "elevator"
  | "common_electricity"
  | "unit_electricity"
  | "water"
  | "hot_water"
  | "heating"
  | "gas"
  | "parking"
  | "long_term_repair_reserve"
  | "repair_maintenance"
  | "food_waste"
  | "other";

export interface MaintenanceFee extends BaseEntity {
  targetMonth: string; // YYYY-MM
  totalAmount: number;
  entryMode: "total_only" | "itemized"; // 총액과 세부항목 이중계산 방지
  dueDate: string | null;
  memo: string | null;
}

export interface MaintenanceFeeItem {
  id: string;
  maintenanceFeeId: string;
  kind: MaintenanceFeeItemKind;
  amount: number;
}

// ─────────────────────────────────────────────
// 예산
// ─────────────────────────────────────────────

export type BudgetScope =
  | "household_monthly"
  | "member"
  | "category"
  | "fixed_expense"
  | "variable_expense"
  | "weekly"
  | "daily";

export type BudgetHealth = "stable" | "needs_attention" | "caution" | "danger" | "exceeded";

export interface Budget extends BaseEntity {
  scope: BudgetScope;
  targetMemberId: string | null;
  targetCategoryId: string | null;
  periodStart: string;
  periodEnd: string;
  limitAmount: number;
  alertThresholds: number[]; // 기본 [70, 90, 100], 사용자 변경 가능
}

// ─────────────────────────────────────────────
// 저축 / 투자
// ─────────────────────────────────────────────

export interface SavingsAccount extends BaseEntity {
  productName: string;
  ownerMemberId: string;
  institution: string;
  monthlyContribution: number;
  currentBalance: number;
  targetAmount: number | null;
  startDate: string;
  maturityDate: string | null;
  interestRate: number | null;
  autoDebitDay: number | null;
  visibility: Visibility;
  memo: string | null;
}

export type InvestmentType =
  | "domestic_stock"
  | "foreign_stock"
  | "etf"
  | "fund"
  | "bond"
  | "pension_savings"
  | "retirement_pension"
  | "crypto"
  | "other";

export interface Investment extends BaseEntity {
  productName: string;
  investmentType: InvestmentType;
  ownerMemberId: string;
  institution: string;
  principal: number;
  currentValuation: number; // 사용자 직접 입력 (자동연동 없음, 요구사항 25)
  purchaseDate: string;
  lastValuationDate: string;
  visibility: Visibility;
  memo: string | null;
}

// ─────────────────────────────────────────────
// 자산 / 부채
// ─────────────────────────────────────────────

export type AssetCategory = "cash_equivalent" | "investment" | "real_asset";

export type AssetKind =
  | "cash"
  | "checking_account"
  | "deposit"
  | "installment_savings"
  | "emergency_fund"
  | "housing_subscription"
  | "domestic_stock"
  | "foreign_stock"
  | "etf"
  | "fund"
  | "bond"
  | "pension_savings"
  | "retirement_pension"
  | "crypto"
  | "apartment"
  | "house"
  | "land"
  | "vehicle"
  | "precious_metal"
  | "other";

export interface Asset extends BaseEntity {
  name: string;
  category: AssetCategory;
  kind: AssetKind;
  ownerMemberId: string;
  isShared: boolean;
  initialAmount: number;
  currentValuation: number;
  acquiredAt: string | null;
  maturityDate: string | null;
  institution: string | null;
  visibility: Visibility;
  memo: string | null;
}

export type LiabilityKind =
  | "mortgage"
  | "jeonse_loan"
  | "credit_loan"
  | "auto_installment"
  | "card_installment"
  | "student_loan"
  | "family_loan"
  | "other";

export interface Liability extends BaseEntity {
  name: string;
  kind: LiabilityKind;
  debtorMemberId: string;
  institution: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  paymentDueDay: number;
  startDate: string;
  maturityDate: string | null;
  visibility: Visibility;
  memo: string | null;
}

/** 월별 자산·부채 스냅샷 (요구사항 28) */
export interface AssetSnapshot {
  id: string;
  householdId: string;
  snapshotMonth: string; // YYYY-MM
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  cashEquivalent: number;
  investmentAssets: number;
  realAssets: number;
  byMember: Record<string, { assets: number; liabilities: number; netWorth: number }>;
  createdAt: string;
}

// ─────────────────────────────────────────────
// 미래수입 시나리오
// ─────────────────────────────────────────────

export type IncomeScenarioKind =
  | "keep_current_job"
  | "job_change"
  | "unemployed_seeking"
  | "spouse_income_only"
  | "with_side_income"
  | "after_pension";

export interface IncomeScenario extends BaseEntity {
  name: string;
  kind: IncomeScenarioKind;
  effectiveFrom: string;
  projectedMonthlyIncome: number;
  memo: string | null;
}

/** 규칙기반 계산 결과 (요구사항 31) — finance-engine의 출력 타입 */
export interface FinanceCalculationResult {
  calculationBasis: {
    periodStart: string;
    periodEnd: string;
    scenarioId: string | null;
    generatedAt: string;
  };
  currentMonthlyIncome: number;
  projectedMonthlyIncome: number;
  incomeDecreaseAmount: number;
  incomeDecreaseRate: number;
  livingExpense: number;
  fixedExpense: number;
  variableExpense: number;
  essentialExpense: number;
  discretionaryExpense: number;
  savingsAmount: number;
  investmentAmount: number;
  debtRepaymentAmount: number;
  monthlySurplus: number;
  monthlyShortfall: number;
  minimumRequiredCut: number;
  weeklyAvailable: number;
  dailyAvailable: number;
  cashRunwayMonths: number;
  budgetExceededAmount: number;
  upcomingCardBilling: number;
  savingsGoalAchievementRate: number;
  debtBurdenRatio: number;
  netWorth: number;
}

// ─────────────────────────────────────────────
// 권고
// ─────────────────────────────────────────────

export type RecommendationSeverity = "info" | "caution" | "warning" | "danger";

export interface RuleBasedRecommendation {
  id: string;
  code: string; // 규칙 식별자 (예: "monthly_deficit", "emergency_fund_low")
  severity: RecommendationSeverity;
  title: string;
  description: string;
  relatedAmount: number | null;
  priority: number; // 요구사항 32의 8단계 우선순위
}

export interface AiRecommendation extends BaseEntity {
  scenarioId: string | null;
  analysisPeriodStart: string;
  analysisPeriodEnd: string;
  requestedBy: string;
  responseText: string;
  generatedAt: string;
  inputHash: string; // 캐시 판단용
  disclaimer: string; // "참고용이며 전문 금융자문을 대신하지 않습니다" 고정 문구
}

// ─────────────────────────────────────────────
// 월마감 / 이력 / 알림
// ─────────────────────────────────────────────

export interface MonthlyClosing {
  id: string;
  householdId: string;
  targetMonth: string;
  confirmedIncome: number;
  confirmedExpense: number;
  confirmedBalance: number;
  closedBy: string;
  closedAt: string;
  reopenedAt: string | null;
  reopenedBy: string | null;
}

export interface AuditLog {
  id: string;
  householdId: string;
  entityTable: string;
  entityId: string;
  action: "create" | "update" | "delete" | "restore" | "closing_cancel";
  changedBy: string;
  changedAt: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
}

export type NotificationKind =
  | "budget_70"
  | "budget_90"
  | "budget_exceeded"
  | "monthly_deficit"
  | "future_income_shortfall"
  | "maintenance_fee_spike"
  | "card_billing_due"
  | "loan_payment_due"
  | "large_expense"
  | "emergency_fund_low"
  | "savings_maturity"
  | "loan_maturity";

export interface AppNotification {
  id: string;
  householdId: string;
  targetUserId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────
// 보고서 / 파일 분석
// ─────────────────────────────────────────────

export type ReportKind = "monthly_household" | "future_income" | "asset_liability" | "custom";

export interface ReportSettings {
  id: string;
  householdId: string;
  kind: ReportKind;
  includeSensitiveInfo: boolean;
  selectedSections: string[];
  createdBy: string;
  createdAt: string;
}

export type FileAnalysisStatus =
  | "uploaded"
  | "analyzing"
  | "review_pending"
  | "confirmed"
  | "discarded";

export interface UploadedFile {
  id: string;
  householdId: string;
  fileName: string;
  fileType: "image" | "pdf";
  fileSizeBytes: number;
  pageCount: number | null;
  retentionPolicy: "delete_immediately" | "30_days" | "1_year" | "keep_until_deleted";
  status: FileAnalysisStatus;
  uploadedBy: string;
  uploadedAt: string;
}

export interface FileAnalysisResult {
  id: string;
  uploadedFileId: string;
  candidateTransactions: Partial<Transaction>[];
  duplicateStatus: "new" | "similar_exists" | "likely_duplicate" | "already_registered";
  confidence: "high" | "low";
}

// ─────────────────────────────────────────────
// 요금제 / 운영
// ─────────────────────────────────────────────

export type PlanTier = "free" | "standard" | "premium";

export interface Subscription {
  id: string;
  householdId: string;
  planTier: PlanTier;
  startedAt: string;
  expiresAt: string | null;
  isTrial: boolean;
  status: "active" | "expired" | "cancelled";
}

export interface PlanFeature {
  planTier: PlanTier;
  featureCode: string;
  limitValue: number | null; // null이면 무제한
}

export interface AiUsageLog {
  id: string;
  householdId: string;
  userId: string;
  requestedAt: string;
  success: boolean;
  estimatedCost: number | null;
}

export interface SmsUsageLog {
  id: string;
  phoneE164: string;
  purpose: "signup" | "password_reset" | "login";
  sentAt: string;
  success: boolean;
  estimatedCost: number | null;
}

export interface Inquiry {
  id: string;
  userId: string;
  householdId: string | null;
  type: string;
  title: string;
  content: string;
  occurredScreen: string | null;
  occurredAt: string;
  status: "open" | "answered" | "closed";
}
