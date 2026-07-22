/** 미래수입 시나리오 화면 공용 라벨 (요구사항 30, 7단계) */

export const INCOME_SCENARIO_KINDS = [
  "keep_current_job",
  "job_change",
  "unemployed_seeking",
  "spouse_income_only",
  "with_side_income",
  "after_pension",
] as const;

export type IncomeScenarioKind = (typeof INCOME_SCENARIO_KINDS)[number];

export const INCOME_SCENARIO_KIND_LABEL: Record<IncomeScenarioKind, string> = {
  keep_current_job: "현재 직장 유지",
  job_change: "이직",
  unemployed_seeking: "퇴사 후 구직 중",
  spouse_income_only: "배우자 소득만",
  with_side_income: "부업 병행",
  after_pension: "은퇴·연금 수령 후",
};
