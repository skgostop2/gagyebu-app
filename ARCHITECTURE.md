# 가족 공동 가계부·미래소득 대응·자산관리 플랫폼 — 시스템 설계 문서

작성일: 2026-07-21
상태: 1단계 착수 전 설계 확정본

---

## 1. 전체 시스템 구조

```
[클라이언트: 모바일/태블릿/PC, PWA]
        │
        ▼
[Next.js App Router — Vercel]
  ├─ 화면(RSC + Client Component)
  ├─ Route Handlers (/app/api/*)  ← 서버 전용 로직 실행 지점
  └─ lib/finance-engine (규칙기반 계산, 순수함수, DB/네트워크 의존 없음)
        │
        ▼
[Supabase]
  ├─ Postgres (RLS로 household 단위 격리)
  ├─ Auth (이메일/비밀번호, 세션)
  ├─ Storage (영수증/PDF 임시 보관, 정책적 자동삭제)
  └─ Edge Function (선택, 예약작업 — 월마감, 파일정리, 반복거래 생성)
        │
        ▼
[외부 서비스 — 전부 서버에서만 호출, 프론트에 키 노출 안함]
  ├─ SMS 발송 인터페이스 (공급자 교체형)
  ├─ AI 추론 API (요청 시에만 호출)
  └─ 이미지·PDF 분석 (OCR/문서파싱, 요청 시에만 호출)
```

원칙: 화면(UI) ↔ 계산엔진(규칙기반) ↔ 데이터(Supabase) ↔ 외부AI를 계층으로 분리한다. 규칙기반 계산은 AI나 외부 API 없이도 100% 동작해야 하므로 독립 모듈로 둔다(요구사항 33 "AI 미작동 시에도 기본 계산 정상 작동").

## 2. 사용자 화면구조 (라우팅)

```
/app
  (auth)/login, /signup, /verify-email, /reset-password
  (onboarding)/household/new, /household/join
  (dashboard)/                      — 홈(요약카드 6개, 그래프1개)
  (dashboard)/transactions          — 수입·지출 등록/목록
  (dashboard)/cards                 — 카드·할부
  (dashboard)/maintenance-fee       — 관리비
  (dashboard)/budget                — 예산
  (dashboard)/savings-investments   — 저축·투자
  (dashboard)/assets-liabilities    — 자산·부채·순자산
  (dashboard)/income-scenarios      — 미래수입 시나리오
  (dashboard)/recommendations       — 기본권고 / AI권고
  (dashboard)/reports               — PDF 보고서
  (dashboard)/household             — 가족관리(구성원/권한/초대)
  (dashboard)/settings              — 설정/요금제/백업
  (admin)/...                       — 운영자 전용 (추후단계)
```

레이아웃 컴포넌트는 반응형 브레이크포인트에서 셸만 교체한다: 모바일은 하단 탭바, PC는 좌측 사이드바, 태블릿은 2열 카드 그리드. 화면 로직(데이터 fetch, 상태)은 공유하고 셸만 분기해 중복코드를 없앤다.

## 3. 데이터베이스 구조

요구사항 64의 테이블 전체를 채택한다. 핵심 원칙:

- 거의 모든 테이블에 `household_id`, `created_by`, `owner_member_id`(해당 시), `created_at`, `updated_at`, `deleted_at`, `visibility`, `status`를 공통 컬럼으로 둔다.
- 삭제는 소프트 삭제(`deleted_at`)를 기본으로 하고, 감사이력(`audit_logs`)에 변경 전/후 값을 남긴다.
- `transactions`는 거래유형(수입/생활지출/저축/투자/이동/원금상환/이자/환급/카드정산)을 enum으로 구분해 합계 계산 시 이중계산을 방지한다.
- `card_transactions`는 `cards`를 참조하고, 카드대금 정산 거래는 `transactions`에 별도 유형으로 기록해 지출과 중복집계되지 않게 한다.
- `asset_snapshots`는 월별 스냅샷 테이블로 순자산 추이를 별도 계산 없이 조회 가능하게 한다.
- 요금제/기능한도는 `plan_features`에 중앙집중, 각 기능 코드가 이 표를 참조.

## 4. 권한구조

- `household_members.role`: `owner | admin | member | viewer`
- 서버 검증 원칙: 클라이언트가 보내는 role 값은 신뢰하지 않고, 모든 쓰기 작업은 RLS 정책 + Route Handler에서 이중 검증한다.
- RLS 기본형: `household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND deleted_at IS NULL)`
- 쓰기 권한은 role별로 정책을 분리한다(예: `transactions` INSERT는 member 이상, `budgets` UPDATE는 admin 이상, `households` DELETE는 owner만).
- `visibility`(공개범위) 컬럼은 SELECT 정책에서 함께 필터링해 "소유자만 공개" 등을 DB 레벨에서 강제한다.

## 5. 인증구조

- Supabase Auth(이메일+비밀번호)를 기본 인증으로 사용, `auth.users`와 1:1로 `user_profiles`를 둬 별명/휴대폰 등 부가정보 저장.
- 이메일 인증은 Supabase 내장 확인메일 흐름 사용.
- 휴대폰 인증은 Supabase Auth와 별도로 `phone_verifications` 테이블(코드, 만료시각, 시도횟수, 상태)로 자체 구현 — 가입 필수 검증 항목이지 로그인 수단이 아니므로 분리하는 편이 구조가 단순함.
- 세션: Supabase의 쿠키 기반 세션(@supabase/ssr)을 사용해 서버 컴포넌트에서도 인증 상태를 확인.
- 소셜로그인(카카오/네이버/구글/애플)은 Supabase Auth Provider로 추후 추가 — 초기 스키마에서 `user_profiles`에 provider 컬럼만 여지를 둔다.

## 6. SMS 인증구조 (기술 구조만, 공급자 관련 논의 제외)

```ts
interface SmsProvider {
  send(phoneE164: string, code: string): Promise<{ ok: boolean; providerMessageId?: string }>
}
```

- 구현체는 `lib/sms/providers/*.ts`에 두고, 실제 사용 구현체는 환경변수(`SMS_PROVIDER`)로 선택 — 코드 변경 없이 교체 가능한 구조만 만든다.
- 1단계에서는 `MockSmsProvider`(콘솔 로그만 남김)만 구현하고, 실제 발송 로직은 이후 단계에서 연결한다.
- OTP 발급/검증/재발송/만료/실패횟수 제한은 Postgres 함수 또는 Route Handler에서 처리, 요청 제한(번호별/IP별/기기별)은 별도 rate-limit 테이블 또는 Supabase Edge Function으로 처리.
- SMS 키는 서버 환경변수에만 존재, 클라이언트 번들에 절대 포함되지 않도록 `lib/sms`는 서버 전용(`"server-only"` 마킹) 모듈로 구성.

## 7. 규칙기반 권고구조

- `lib/finance-engine/` 순수 TypeScript 함수 모음. 입력은 이미 조회된 구조화 데이터(수입/지출/자산/부채 배열), 출력은 계산결과 객체. DB나 네트워크 접근 없음 → 단위테스트 용이.
- 계산항목: 월잉여금/부족금, 예산사용률, 저축목표달성률, 부채상환부담률, 자금유지가능기간, 미래수입 시나리오 결과 등 요구사항 31 전체.
- 권고 생성(요구사항 32)은 계산결과에 규칙(if/threshold)을 적용하는 별도 함수 `generateRuleBasedRecommendations(calcResult)`로 분리 — 계산과 권고 로직을 나눠 테스트와 유지보수를 쉽게 한다.
- 계산 기준(사용된 수식, 기준일자)을 결과 객체에 함께 담아 화면에 "계산기준 보기"로 노출한다(요구사항 31 "사용자가 계산 기준을 확인할 수 있게 한다").

## 8. AI 권고구조

- 버튼 클릭 시에만 Route Handler(`/app/api/ai/recommend`)를 통해 서버에서만 AI API 호출. 클라이언트에 API 키 노출 없음.
- 전달 데이터는 `finance-engine`의 계산결과 + 익명화된 항목명만. 카드번호/계좌번호/주민번호/비밀번호 등은 애초에 이 계산결과 객체에 포함되지 않는 구조로 설계(원천 차단).
- 시스템 프롬프트에 금지사항 명시(특정 상품 매수·매도·해지 단정 금지, 계산값 임의 변경 금지 등 요구사항 33).
- 응답은 `ai_recommendations` 테이블에 저장(분석기준기간, 사용 시나리오, 생성일시, 참고용 안내 문구 포함), 동일 입력 반복요청은 캐시로 비용 절감.
- `ai_usage_logs`에 사용자별/가정별/월별 요청·성공·실패 건수 기록 → 요금제 한도 검증에 사용.

## 9. 이미지·PDF 분석구조

- 업로드 → Supabase Storage(임시 버킷) → 파일형식/크기/실제형식 검사 → PDF 유형 판별(텍스트형/스캔형) → 텍스트형은 텍스트 추출 우선, 스캔형만 이미지 변환 후 OCR.
- 분석은 Route Handler에서 서버 전용으로 동적 로딩(`next/dynamic` 또는 route 단위 code split)해 평소 번들에는 포함되지 않게 한다.
- 결과는 "거래 후보" 상태로 임시 저장 → 사용자 미리보기/수정/제외 → 중복확인(거래일·시간·금액·가맹점·카드·승인번호·파일해시 비교) → 확정 시에만 `transactions`에 반영.
- 원본파일은 기본 "분석 후 즉시삭제", 사용자가 보관을 선택한 경우에만 `uploaded_files`에 보관기간(30일/1년/직접삭제)과 함께 저장.

## 10. 예상 패키지

| 영역 | 패키지 | 비고 |
|---|---|---|
| 프레임워크 | next, react, typescript | |
| 스타일 | tailwindcss | |
| 백엔드 연동 | @supabase/supabase-js, @supabase/ssr | |
| 폼/검증 | react-hook-form, zod | 전 프로젝트 공통, 중복 라이브러리 방지 |
| 서버상태 | @tanstack/react-query | Supabase 데이터 캐싱/재조회 일원화 |
| 그래프 | recharts | 요구사항 지정값 |
| 날짜 | date-fns (ko 로케일) | 한국식 날짜 표시 |
| 아이콘 | lucide-react | 경량 |
| PDF 생성 | @react-pdf/renderer 또는 pdf-lib (동적 로딩) | 요청 시에만 로딩 |
| PDF 텍스트추출 | pdfjs-dist (동적 로딩) | 텍스트형 PDF용 |
| 이미지 압축 | browser-image-compression (클라이언트) | 업로드 전 압축 |
| PWA | 수동 서비스워커 또는 next-pwa | 경량 우선, 필요시만 |

동일 목적 라이브러리를 중복 설치하지 않는다는 원칙을 지키기 위해, 이 표를 프로젝트 전체의 "지정 라이브러리 목록"으로 고정하고 이후 단계에서 새 패키지가 필요하면 이 표에 먼저 추가·기록한다.

## 11. 운영비용이 발생하는 기능

실사용자 대상으로 전환되면 아래 기능은 사용량에 비례해 비용이 발생한다 — 설계 시점에 인지만 해두고 각 단계에서 사용량 로깅(`ai_usage_logs`, `sms_usage_logs`)을 함께 구현한다.

- Supabase (DB·Auth·Storage 사용량)
- Vercel 호스팅/대역폭
- SMS 발송 (건당 과금)
- AI API 호출 (요청당 과금)
- 이미지·PDF 분석 연산

## 12. 주요 보안위험

- RLS 정책 누락/오류로 인한 가정 간 데이터 유출 — 정책은 테이블 추가 시마다 필수 체크리스트로 관리.
- 카드/계좌 민감정보 저장 실수 (카드전체번호, CVC, 비밀번호) — DB 스키마 자체에 해당 컬럼을 만들지 않아 원천 차단.
- AI 호출 시 익명화 누락으로 민감정보 유출 — AI 입력 직전 화이트리스트 필드만 추출하는 어댑터 함수로 강제.
- 파일 업로드를 통한 악성파일/과대용량 공격 — 형식/크기/실제 콘텐츠 검사, 페이지 수 제한.
- SMS 인증 남용(무차별 발송으로 비용 유발) — 번호/IP/기기별 요청 제한과 차단.
- 세션 하이재킹 — Supabase 세션 쿠키 HttpOnly/Secure, CSRF 고려.
- 권한 상승 — 클라이언트가 보낸 role을 신뢰하지 않고 서버에서 항상 재검증.
- 백업파일 평문 노출 — 백업 암호화, 비밀번호/토큰/SMS키는 백업에서 제외.

## 13. 초기 버전(MVP) 포함 기능

인증(이메일 회원가입/로그인, 이메일 인증 — SMS는 구조만), 가정 생성/초대/권한, 수입·지출·카테고리 CRUD, 카드 등록 및 카드거래·할부, 관리비, 예산, 저축·투자·자산·부채 등록, 순자산 자동계산, 미래수입 시나리오, 규칙기반 계산·기본권고, 간결한 대시보드, 반응형 UI(모바일/태블릿/PC), 반복거래, 앱 내부 알림, 월마감, 수정·삭제 이력.

## 14. 추후 기능

AI 상세권고, 이미지·PDF 거래등록, PDF 보고서 생성, 카카오톡/기기 공유, CSV·엑셀 가져오기/내보내기, 백업·복원, 요금제 결제 연동, 운영자 콘솔, 소셜로그인, 실제 SMS 발송 연동, 푸시 알림, 확장 감사로그.

## 15. 단계별 개발순서

1. **1단계 — 스캐폴딩**: 프로젝트 구조, 반응형 셸, 디자인시스템, 전체 데이터 타입, mock 데이터. 실연동 없음.
2. **2단계 — 인증·가정**: Supabase 연결, 이메일 회원가입/로그인, 가정 생성/초대, 권한(RLS) 기초.
3. **3단계 — 수입·지출 핵심**: 카테고리, 거래 CRUD, 반복거래.
4. **4단계 — 카드·관리비**: 카드 등록, 카드거래·할부, 관리비.
5. **5단계 — 예산**: 예산 유형별 관리, 알림 임계치.
6. **6단계 — 저축·투자·자산·부채**: 등록/조회, 순자산 자동계산, 월별 스냅샷.
7. **7단계 — 미래수입 시나리오 + 규칙기반 계산엔진**: `finance-engine` 구현, 기본권고.
8. **8단계 — 대시보드·상세그래프**: 반응형 대시보드, Recharts 연동.
9. **9단계 — 월마감·수정삭제이력·알림**: 감사로그, 앱 내부 알림.
10. **10단계 — 이미지·PDF 거래등록**: 업로드→분석→검토→확정 흐름.
11. **11단계 — AI 상세권고**: 서버 전용 AI 연동, 사용량 관리.
12. **12단계 — PDF 보고서·공유**: 보고서 생성, Web Share API 연동.
13. **13단계 — 가져오기/내보내기·백업복원**.
14. **14단계 — 요금제 구조·운영자 기능·문의**.
15. **15단계 — 보안 점검·접근성 점검·경량화 마무리**.

각 단계 완료 후 요구사항 3장의 20개 원칙에 따라 보고한다.

---

다음: 1단계(스캐폴딩) 구현.
