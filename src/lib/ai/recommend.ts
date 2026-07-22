/**
 * AI 상세권고 (요구사항 33, 아키텍처 문서 8번) — 서버 전용.
 * 클라이언트에는 절대 API 키를 노출하지 않는다. Route Handler에서만 이 모듈을 import한다.
 */
import "server-only";
import { createHash } from "node:crypto";
import type { FinanceCalculationResult, RuleBasedRecommendation } from "@/lib/types";

const SYSTEM_PROMPT = `당신은 가계부 앱의 재무 도우미입니다. 사용자가 이미 규칙기반으로 계산한 재무 수치를 참고해 이해하기 쉬운 한국어 설명과 조언을 제공합니다.

반드시 지켜야 할 규칙:
1. 특정 금융상품(주식/펀드/보험/부동산 등)의 매수·매도·해지·가입을 단정적으로 권고하지 않는다. 일반적인 원칙 수준으로만 언급한다.
2. 전달받은 계산값(수입/지출/자산/부채 등 숫자)을 절대 임의로 바꾸거나 새로 만들어내지 않는다. 전달받은 숫자만 근거로 설명한다.
3. 이 조언은 참고용이며 전문 금융자문을 대신하지 않는다는 점을 응답 끝에 자연스럽게 언급한다.
4. 실제로 확인되지 않은 사실(예: 특정 금리, 특정 상품명)을 지어내지 않는다.
5. 과도하게 길게 쓰지 말고, 3~5개의 짧은 문단이나 목록으로 핵심만 정리한다.
6. 존댓말을 사용하고, 비난하거나 불안을 조장하는 표현은 피한다.`;

interface RecommendInput {
  result: FinanceCalculationResult;
  ruleBasedRecommendations: RuleBasedRecommendation[];
}

export interface AiRecommendOutcome {
  ok: true;
  text: string;
  inputHash: string;
}

export interface AiRecommendFailure {
  ok: false;
  reason: "not_configured" | "api_error";
  message: string;
}

/** 계산결과 + 규칙기반 권고만 전달한다 — 카드번호/계좌번호 등 민감정보는 이 객체에 애초에 존재하지 않는다 */
function buildAnonymizedPayload(input: RecommendInput) {
  const { result, ruleBasedRecommendations } = input;
  return {
    기준기간: { 시작: result.calculationBasis.periodStart, 종료: result.calculationBasis.periodEnd },
    이번달수입: result.currentMonthlyIncome,
    예상수입: result.projectedMonthlyIncome,
    수입감소액: result.incomeDecreaseAmount,
    수입감소율: result.incomeDecreaseRate,
    생활지출: result.livingExpense,
    고정지출: result.fixedExpense,
    변동지출: result.variableExpense,
    필수지출: result.essentialExpense,
    선택지출: result.discretionaryExpense,
    저축액: result.savingsAmount,
    투자액: result.investmentAmount,
    부채상환액: result.debtRepaymentAmount,
    월잉여금: result.monthlySurplus,
    월부족금: result.monthlyShortfall,
    최소절감필요액: result.minimumRequiredCut,
    자금유지가능개월: result.cashRunwayMonths,
    예산초과액: result.budgetExceededAmount,
    예산달성률: result.savingsGoalAchievementRate,
    부채부담비율: result.debtBurdenRatio,
    순자산: result.netWorth,
    기본권고목록: ruleBasedRecommendations.map((r) => ({ 제목: r.title, 설명: r.description, 심각도: r.severity })),
  };
}

export function computeInputHash(input: RecommendInput): string {
  const payload = buildAnonymizedPayload(input);
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

type AiProvider = "anthropic" | "openai";

/**
 * 어느 제공자를 쓸지 결정한다.
 * - AI_PROVIDER를 명시하면 그대로 따른다.
 * - 명시하지 않으면 등록된 키를 보고 자동판별한다(Anthropic 키 우선, 없으면 OpenAI 키).
 * - 둘 다 없으면 null(미설정).
 */
function resolveProvider(): AiProvider | null {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "anthropic" || explicit === "openai") return explicit;

  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (anthropicKey) return "anthropic";
  if (openaiKey) return "openai";
  return null;
}

function userPrompt(payloadJson: string): string {
  return `아래는 한 가정의 이번 달 재무 계산 결과입니다(JSON). 이 수치를 바탕으로 이해하기 쉬운 조언을 작성해 주세요.\n\n${payloadJson}`;
}

async function callAnthropic(payloadJson: string): Promise<AiRecommendOutcome | AiRecommendFailure> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "claude-sonnet-4-5-20250929";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(payloadJson) }],
    }),
  });

  if (!response.ok) {
    return { ok: false, reason: "api_error", message: `AI 호출 중 문제가 발생했습니다. (status ${response.status})` };
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    return { ok: false, reason: "api_error", message: "AI 응답을 해석하지 못했습니다." };
  }
  return { ok: true, text, inputHash: "" };
}

async function callOpenAi(payloadJson: string): Promise<AiRecommendOutcome | AiRecommendFailure> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(payloadJson) },
      ],
    }),
  });

  if (!response.ok) {
    return { ok: false, reason: "api_error", message: `AI 호출 중 문제가 발생했습니다. (status ${response.status})` };
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (!text) {
    return { ok: false, reason: "api_error", message: "AI 응답을 해석하지 못했습니다." };
  }
  return { ok: true, text, inputHash: "" };
}

/**
 * 등록된 키에 따라 Anthropic(Claude) 또는 OpenAI(ChatGPT) 중 하나를 자동으로 호출한다.
 * 둘 다 미설정이면 "not_configured"로 응답한다. (요구사항: 특정 벤더에 종속되지 않도록 구조를 분리)
 */
export async function requestAiRecommendation(input: RecommendInput): Promise<AiRecommendOutcome | AiRecommendFailure> {
  const provider = resolveProvider();
  if (!provider) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "AI 상세권고 기능이 아직 설정되지 않았습니다. 관리자가 ANTHROPIC_API_KEY 또는 OPENAI_API_KEY 중 하나를 등록하면 사용할 수 있습니다.",
    };
  }

  const payload = buildAnonymizedPayload(input);
  const payloadJson = JSON.stringify(payload, null, 2);
  const inputHash = computeInputHash(input);

  try {
    const outcome = provider === "anthropic" ? await callAnthropic(payloadJson) : await callOpenAi(payloadJson);
    return outcome.ok ? { ...outcome, inputHash } : outcome;
  } catch {
    return { ok: false, reason: "api_error", message: "AI 호출 중 네트워크 문제가 발생했습니다." };
  }
}
