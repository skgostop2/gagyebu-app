# 진행상황

마지막 업데이트: 2026-07-22 (실배포 완료 + AI 제공자 이원화)

다음 세션은 이 파일부터 읽고 시작한다.

---

## 배포 정보

- GitHub: `github.com/skgostop2/gagyebu-app` (main 브랜치)
- Vercel: `https://gagyebu-app-omega.vercel.app` — GitHub `main` 브랜치에 push하면 자동 재배포됨
- Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq (ap-northeast-2)
- Supabase Auth "Confirm email"은 배포 후 꺼서(off) 가입 즉시 로그인되도록 운영 중 — `src/app/(auth)/signup/page.tsx`는 이 설정 여부와 관계없이 양쪽 다 동작하도록 이미 분기 처리돼 있음(`data.session` 있으면 즉시 홈 이동, 없으면 이메일 인증 대기 화면)
- Auth URL Configuration의 Site URL/Redirect URLs는 배포 도메인(`https://gagyebu-app-omega.vercel.app`)으로 갱신됨

### 배포 후 추가 변경 — AI 상세권고 제공자 이원화 (Anthropic + OpenAI)
`src/lib/ai/recommend.ts`를 Anthropic(Claude) 전용에서 Anthropic/OpenAI(ChatGPT) 자동판별 구조로 변경했다.
- `AI_PROVIDER` 환경변수로 명시 지정 가능(`anthropic`|`openai`), 비워두면 등록된 키를 보고 자동판별(Anthropic 우선)
- Anthropic: `ANTHROPIC_API_KEY`(신규) 또는 `AI_API_KEY`(기존, 하위호환 유지), 모델은 `AI_MODEL`
- OpenAI: `OPENAI_API_KEY`, 모델은 `OPENAI_MODEL`(기본 `gpt-4o-mini`)
- 두 제공자 모두 응답 파싱만 다르고 반환 타입(`AiRecommendOutcome`/`AiRecommendFailure`)과 호출부(`/api/ai/recommend`)는 그대로라 기존 캐시·사용량 로그 로직에 영향 없음
- 현재는 두 키 다 미설정 상태로 배포됨(AI 버튼은 안내 문구만 표시) — 둘 중 하나를 Vercel 환경변수에 추가하면 재배포 없이 바로 다음 요청부터 적용됨(Vercel 환경변수 변경 시 자동 재배포됨)
- `.env.example`에 새 변수 반영 완료. `/tmp/verify3` 미러에서 tsc·eslint·vitest 통과 확인(같은 세션의 샌드박스 인프라 이슈로 `next build` 전체 통과는 매 시도 컴파일 성공 지점까지만 확인했고, 최종 빌드 성공 여부는 Vercel의 자체 빌드로 확인됨 — 배포 상태가 Ready면 통과된 것)

### 배포 후 추가 변경 — 화면전환 속도 개선, 초대코드 유효기간 선택, 내 정보(전화번호) 조회·수정
- **화면전환 속도**: 사용자가 "화면 전환이 느리다"고 지적 → 원인은 `(dashboard)/layout.tsx`, `TopBar.tsx` 등 여러 서버 컴포넌트가 같은 요청 안에서 각자 `supabase.auth.getUser()`를 호출해 매번 Supabase Auth로 별도 네트워크 왕복이 발생하던 것. `src/lib/supabase/server.ts`에 React `cache()`로 감싼 `getAuthUser()` 헬퍼를 추가해, 같은 요청 안에서는 실제 호출이 한 번만 일어나도록 함. 우선 매 네비게이션마다 항상 실행되는 `(dashboard)/layout.tsx`·`TopBar.tsx`·`settings/page.tsx` 3곳에 적용. 나머지 개별 페이지(`transactions`, `budget` 등 약 20개)는 아직 각자 `supabase.auth.getUser()`를 직접 호출하는 상태로 남아있음 — 필요시 같은 패턴으로 추가 적용 가능.
- **초대코드 유효기간 선택**: `CreateInvitationButton.tsx`에서 기존 고정 7일 대신 1/3/7/14/30일 중 직접 선택 가능하도록 드롭다운 추가.
- **내 정보(전화번호) 조회·수정**: 회원가입 때 입력한 휴대폰 번호는 `handle_new_user` 트리거를 통해 `user_profiles.phone`에 자동 저장되고 있었지만, 지금까지 화면 어디에서도 그 값을 다시 보여주지 않았다(입력만 받고 조회 경로가 없었음). `/settings` 상단에 "내 정보" 카드(`src/components/settings/ProfileForm.tsx`)를 추가해 이름·전화번호를 조회하고 직접 수정·저장할 수 있게 함(RLS는 본인 행만 조회·수정 가능하도록 이미 적용돼 있어 추가 정책 변경 없음).
- 사라졌던 `/tmp/verify3` 미러 대신 `/tmp/verify4`를 새로 clone해 tsc·eslint·vitest 통과 확인, `npm run build`는 컴파일·정적페이지 생성(32/32)까지 매 시도 성공하나 마지막 "Collecting build traces" 단계가 샌드박스 I/O 특성상 45초 제한을 넘겨 끝까지 확인하지 못함(Vercel 자체 빌드로 최종 확인 예정).

### 배포 후 추가 변경 — 가정별 AI API 키 등록
사용자 질문("다른 가족은 자기 API 키를 쓰게 해야지")에 대응해, AI 상세권고에 쓰는 API 키를 서버 전역 환경변수 하나로만 공유하던 구조에서 가정별로 자체 키를 등록할 수 있는 구조로 확장했다.
- 새 테이블 `household_ai_config`(household_id PK, provider, api_key, model, updated_at) — RLS는 owner/admin만 SELECT/INSERT/UPDATE/DELETE 가능(민감정보라 일반 구성원은 직접 조회 불가).
- 실제 AI 호출 시점에는 일반 구성원도 "사용"은 할 수 있어야 하므로, `is_household_member`만 확인하는 SECURITY DEFINER 함수 `get_household_ai_config(hh_id)`를 별도로 두어 우회 조회 경로를 만들었다(원본 테이블 SELECT 권한은 owner/admin으로 계속 제한됨). 최초 배포 시 anon 역할까지 이 함수를 실행 가능한 상태였던 것을 발견해 `revoke execute ... from anon`으로 즉시 회수(9단계 `close_month`와 동일한 패턴의 문제).
- `src/lib/ai/recommend.ts`의 `requestAiRecommendation()`이 `householdOverride` 파라미터를 받도록 확장 — 가정이 등록한 키가 있으면 그 키·제공자·모델을 최우선 사용하고, 없으면 기존처럼 서버 전역 `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`로 폴백한다.
- `/settings`에 "AI API 키 (가정별)" 카드(`src/components/settings/HouseholdAiKeyForm.tsx`)를 owner/admin에게만 노출 — 키 값은 저장 후 화면에 다시 표시하지 않는 write-only 방식이고, 등록 여부·제공자만 보여준다. "키 삭제" 시 공용 키로 자동 되돌아간다.
- `/tmp/verify4`에서 tsc·eslint·vitest 통과, `npm run build`도 이번엔 트레이스 수집 단계까지 포함해 완전히 성공(32개 라우트 전부 정상 생성) 확인 후 커밋·푸시함.

### 배포 후 추가 변경 — 화면전환 성능개선 범위 확대
사용자가 "항목 클릭하면 여전히 느리다"고 재확인 → 앞서 `layout.tsx`/`TopBar.tsx`/`settings`에만 적용했던 `getAuthUser()` 캐시 헬퍼를, `supabase.auth.getUser()`를 직접 호출하던 나머지 대시보드 페이지 20개 전부와 `(auth)`/`(onboarding)` 레이아웃까지 확대 적용했다. 이제 한 번의 페이지 이동(서버 렌더 1회) 안에서는 로그인 확인이 몇 번을 호출되든 실제 네트워크 요청은 1번만 발생한다. 부수적으로 `transactions/new/page.tsx`의 미사용 타입 import(`SelectableTransactionType`, 이번 변경과 무관한 기존 경고)도 함께 정리했다.
`/tmp/verify4`에서 tsc·eslint(0 경고)·vitest 통과 확인. `npm run build`는 컴파일까지는 매 시도 10~16초로 빨랐으나 이번엔 "Linting and checking validity of types" 단계에서 반복적으로 45초 제한에 걸려 끝까지 확인하지 못함(직전 커밋에서는 같은 환경으로 전체 빌드 성공을 이미 확인한 바 있어 코드 문제가 아닌 샌드박스 부하로 판단) — Vercel 자체 빌드로 최종 확인 예정.

---

## 현재 상태: 15단계(보안 점검·접근성 점검·경량화 마무리) 완료 — MVP 전체 완료

15단계는 새 기능을 추가하는 단계가 아니라, 1~14단계에서 만든 것 전체를 점검하고 다듬는 마무리 단계다. ARCHITECTURE.md의 15단계 개발순서 전체(1~15단계)가 이번으로 완료된다.

### 구현한 기능 (점검·수정 내역)

**보안 점검**
- Supabase 보안 어드바이저 전체 재점검 — 프로젝트 시작 이후 쌓인 모든 테이블·함수·정책을 다시 확인. 새로 발견된 실질적 문제 없음(각 RPC 함수의 "authenticated가 실행 가능" 경고는 클라이언트에서 의도적으로 호출하는 함수들이라 정상, 매 단계마다 반복 확인해온 것과 동일)
- 성능 어드바이저에서 실제 문제 2건 발견해 수정: (1) `households.plan_code`, `inquiries.answered_by` — 인덱스 없는 FK 2건에 인덱스 추가. (2) `households`, `ai_usage_logs` 테이블에 14단계에서 운영자용 정책을 추가하며 생긴 "중복 permissive 정책"(같은 역할·같은 동작에 정책이 2개씩 붙어 매 쿼리마다 둘 다 평가되는 비효율) — 각각 OR 조건의 정책 1개로 통합해 해소
- 로그인 실패 방지책인 "유출된 비밀번호 차단"(HaveIBeenPwned 연동)은 Supabase 대시보드의 Auth 설정에서 켜야 하는 항목으로, SQL로 제어할 수 없어 알려진 문제로 남김(아래 명시)

**접근성 점검**
- 아이콘만 있고 텍스트가 없는 버튼/링크 3곳에 `aria-label` 추가: 상단바 알림 벨(TopBar), 거래목록의 영수증 첨부 아이콘, 관리비 항목별 삭제(X) 버튼
- 레이블 없이 placeholder만 있던 입력 4곳 보완: 운영자 문의답변 textarea(`sr-only` 레이블), 비밀번호 재설정 이메일/휴대폰 입력(`sr-only` 레이블), 관리비 항목별 종류 선택·금액 입력(`aria-label`), 예산 알림 임계치 3개 입력(각각 구분되는 `aria-label` — 기존엔 레이블 1개가 입력 3개를 묶어 스크린리더로 구분이 안 됐음)
- 공용 `Button` 컴포넌트에 `focus-visible` 스타일을 추가해 키보드 탭 이동 시 포커스 위치가 보이도록 함(이전에는 브라우저 기본 아웃라인에만 의존했고, 입력 필드들은 이미 `focus:border-neon-blue`로 포커스가 보였지만 버튼은 스타일이 없었음)
- 이미지는 `<img>` 1곳(영수증 미리보기)뿐이며 `alt` 텍스트 이미 있음. 페이지 제목(h1) 중복이나 `<div onClick>`식 비시맨틱 인터랙션은 발견되지 않음(전수 점검 결과)

**경량화**
- 미사용 의존성 `@tanstack/react-query` 제거(package.json) — 코드 어디에서도 import되지 않는 상태로 1단계 스캐폴딩 때부터 남아있던 것을 확인 후 제거
- 대시보드 홈(`/`)에서 `TrendChart`(recharts 사용) 정적 import를 `next/dynamic` 지연로딩으로 전환 — `/reports` 화면은 8단계부터 이미 이 패턴을 쓰고 있었는데 홈 화면만 누락되어 있었음. 실측 결과 "/" 라우트의 First Load JS는 거의 변화가 없었음(208→209kB, 오차 범위) — Next.js가 SSR을 유지하는 `dynamic()`은 초기 하이드레이션에 필요한 청크를 여전히 포함시키기 때문으로 보이며, 로딩 스켈레톤이 표시되는 이점은 있지만 번들 크기 절감 효과는 크지 않았다는 점을 정직하게 기록한다
- 전체 32개 라우트 빌드 결과 재확인: 공유 청크 102kB 기준, 대부분 라우트 170~210kB, 그래프가 많은 `/reports`만 281kB — 12~14단계 대비 이번 단계에서 유의미하게 늘어난 라우트 없음

### 생성한 파일
없음(이번 단계는 기존 파일 수정만).

### 수정한 파일
`src/components/layout/TopBar.tsx`, `src/app/(dashboard)/transactions/page.tsx`, `src/components/maintenance/MaintenanceFeeForm.tsx`, `src/components/admin/InquiryReplyForm.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/components/budget/BudgetForm.tsx`, `src/components/ui/Button.tsx`(이상 접근성), `src/app/(dashboard)/page.tsx`(경량화 — dynamic import), `package.json`(경량화 — 미사용 패키지 제거)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 1건 추가 적용 — `phase15_fk_index_and_policy_consolidation`(FK 인덱스 2건 추가, `households`/`ai_usage_logs`의 중복 SELECT 정책을 각각 1개로 통합). 보안 어드바이저 경고는 기존과 동일한 의도된 RPC 경고 8건 + Auth 대시보드 설정 1건만 남음. 성능 어드바이저의 WARN(실제 문제) 2건은 모두 해소, 남은 것은 트래픽이 거의 없는 개발용 프로젝트라서 뜨는 "미사용 인덱스" INFO뿐(실사용이 시작되면 자연히 해소됨).

### 추가/변경한 패키지
`@tanstack/react-query` 제거(미사용). 그 외 추가 없음.

### 실행방법
```bash
npm install
npm run dev
```
평소와 동일하게 실행. 이번 단계는 화면상 새로운 진입점이 없고, 스크린리더·키보드 탐색으로 확인하거나 개발자도구 Lighthouse 접근성 점검으로 개선 여부를 확인할 수 있다.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 성공, 32개 라우트 전부 정상 생성, 라우트별 크기 표 확인
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안 어드바이저: 재점검 후 새 문제 없음(기존 의도된 경고만 유지)
- Supabase 성능 어드바이저: WARN 2건(인덱스 없는 FK, 중복 정책) 수정 후 재점검으로 해소 확인

### 알려진 문제 (MVP 전체 기준으로 남는 한계)
- Supabase Auth의 "유출된 비밀번호 차단"(HaveIBeenPwned 연동)은 SQL로 켤 수 없는 대시보드 설정이라 이번 단계에서 켜지 못했다 — Supabase 대시보드 Authentication → Policies에서 수동으로 켜는 것을 권장.
- 접근성 점검은 코드 전수 검토(아이콘 버튼·폼 레이블·포커스 스타일·시맨틱 태그) 기준으로 진행했고, 실제 스크린리더(VoiceOver/NVDA)나 자동화된 Lighthouse 점수로 검증하지는 않았다.
- 명도대비는 CSS 변수 값을 확인만 했고 WCAG 대비율(4.5:1 등)을 수치로 계산·검증하지는 않았다 — `text-muted` 색상이 다크/라이트 테마에서 동일한 회색을 쓰고 있어 향후 테마별로 분리해 대비를 높일 여지가 있다.
- 경량화는 명백한 낭비(미사용 패키지, 누락된 dynamic import) 위주로 처리했고, 이미지 최적화·폰트 서브셋팅·API 응답 캐싱 같은 더 깊은 최적화는 다루지 않았다.
- 요금제 결제 연동(14단계), CSV 가져오기 형식 제한(13단계), 알림 개인화(9단계) 등 이전 단계에서 이미 기록한 알려진 제한사항은 그대로 남아 있다 — MVP 범위 밖으로 문서화된 것들이다.

### 빌드 용량
`.next` 산출물 기준 공유 청크 102kB, 라우트별 First Load JS 102~281kB(대부분 170~210kB) — 14단계와 거의 동일한 수준으로 유지됨.

### 다음 단계 준비사항
ARCHITECTURE.md 15단계 개발순서가 전부 완료됐다. 이후 실사용을 위해서는: (1) 실제 AI API 키·SMS 공급자 등 `.env.local`의 자리표시자 값들을 실제 값으로 교체, (2) Supabase 프로젝트를 실서비스용 요금제로 전환하고 Auth 대시보드에서 유출된 비밀번호 차단을 켜는 등 운영 설정 마무리, (3) 요금제 결제 연동 등 "추후 기능"으로 명시적으로 남겨둔 항목들을 필요에 따라 우선순위대로 추가 개발하는 것을 권장한다.

---

## 현재 상태 (이전): 14단계(요금제 구조·운영자 기능·문의) 완료

### 구현한 기능
- 요금제 구조 — `plan_features` 중앙집중 원칙(요구사항 67)에 따라 `pricing_plans` 테이블에 무료/플러스/프로 3개 티어를 두고 AI 상세권고 월 한도(5/30/100회)·구성원 수 한도(4/8/20명)·월 가격을 함께 관리. `households.plan_code`로 가정마다 요금제를 연결(기본값 무료). 실제 결제 연동(카드등록·정기결제)은 이번 단계 범위에서 제외 — `/pricing`에서 요금제 비교와 현재 요금제 표시까지만 지원
- AI 사용한도 실연결 — 11단계에서 하드코딩했던 월 20회 고정값을 제거하고, `/api/ai/recommend`가 요청 시점에 가정의 `plan_code`로 `pricing_plans.ai_monthly_limit`를 조회해 실제 한도로 사용하도록 교체. 한도 초과 안내 메시지에 현재 요금제명과 "업그레이드하면 한도가 늘어난다"는 문구 추가
- 문의하기 — `/inquiries`에서 로그인한 사용자가 이메일·제목·내용으로 문의를 접수하고, 자신의 문의 내역과 상태(접수됨/답변완료/종료)·운영자 답변을 확인
- 운영자 콘솔 — `/admin`에서 이번 달 전체 AI 사용량(성공/한도초과/실패), 전체 가정 목록(이름·요금제·구성원수·가입일), 전체 문의 목록을 확인하고 문의에 직접 답변. 플랫폼 운영자 여부는 가정 내 role(owner/admin/member/viewer)과는 별개의 전역 플래그(`user_profiles.is_platform_admin`)로 판별하며, 이 플래그는 앱 화면에서 설정할 수 없고 직접 SQL로만 부여(가입 즉시 최고권한이 생기는 경로를 원천 차단)
- `/settings`에 현재 요금제 요약과 "요금제 보기" 링크를 추가하고, 운영자 계정에는 "운영자 콘솔로 이동" 링크가 조건부로 표시됨
- 사이드바 "가정" 그룹에 "요금제"·"문의하기" 메뉴 추가(모바일 하단탭 5개는 요구사항대로 그대로 유지)

### 생성한 파일
`src/app/(dashboard)/pricing/page.tsx`, `src/app/(dashboard)/inquiries/page.tsx`, `src/app/(dashboard)/admin/page.tsx`, `src/components/inquiries/InquiryForm.tsx`, `src/components/admin/InquiryReplyForm.tsx`

### 수정한 파일
`src/app/api/ai/recommend/route.ts`(하드코딩 한도 → 요금제 기반 조회), `src/app/(dashboard)/settings/page.tsx`(요금제 요약·운영자 링크 추가), `src/components/layout/nav-config.ts`(요금제·문의하기 메뉴), `src/lib/supabase/database.types.ts`(재생성)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 3건 추가 적용 — `phase14_pricing_admin_inquiries_schema`(`pricing_plans`·`inquiries` 테이블, `households.plan_code` 컬럼, `user_profiles.is_platform_admin` 컬럼, `is_platform_admin()` 헬퍼 함수, RLS 전체를 한 마이그레이션에 포함), `phase14_updated_at_triggers_and_audit`(updated_at 트리거 2건 + `inquiries` 감사이력 트리거), `phase14_admin_read_policies`(운영자가 전체 가정·전체 AI 사용로그를 조회할 수 있는 admin 전용 SELECT 정책 추가, 기존 일반 사용자 정책과 별도로 공존).
테이블 2개 신규(`pricing_plans` — 3개 티어 시드 데이터 포함, `inquiries`), 컬럼 2개 신규(`households.plan_code`, `user_profiles.is_platform_admin`), 함수 1개 신규(`is_platform_admin` — SECURITY DEFINER). 보안 어드바이저 점검 결과 새로 발생한 경고 없음(기존과 동일한 의도된 `authenticated` RPC 경고만 남음).

### 추가/변경한 패키지
없음.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/pricing`에서 요금제 확인, `/inquiries`에서 문의 접수. 운영자 콘솔(`/admin`)은 Supabase에서 `update user_profiles set is_platform_admin = true where id = '...'`로 직접 권한을 부여해야 접근 가능(화면에서 셀프 승격 불가).

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 성공, `/pricing`·`/inquiries`·`/admin` 라우트 포함 32개 라우트 전부 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안 어드바이저: 의도되지 않은 경고 0건

### 알려진 문제
- 실제 결제(카드등록·정기결제·요금제 변경)는 아직 없다 — 모든 가정은 무료 요금제로 시작하고, 요금제를 바꾸려면 지금은 운영자가 직접 SQL로 `households.plan_code`를 변경해야 한다.
- 문의는 이메일 알림 없이 앱 화면에서만 확인 가능하다(운영자가 답변해도 사용자에게 별도 알림이 가지 않음) — 9단계 알림 시스템과의 연동은 이후 과제.
- 구성원 수 한도(`pricing_plans.member_limit`)는 표시만 되고 실제로 초대 시점에 강제되지는 않는다 — 실제 초대 제한 적용은 이후 과제.
- 운영자 콘솔의 가정 목록·문의 목록은 페이지네이션이 없다(전체를 한 번에 조회) — 가정 수가 많아지면 개선이 필요하다.

### 빌드 용량
`.next` 산출물 규모는 13단계와 유사한 수준(신규 라우트 3개 추가분 정도만 증가).

### 다음 단계 준비사항 (15단계 — 보안 점검·접근성 점검·경량화 마무리)
1. 전체 RLS·API 라우트 보안 재점검, Supabase 보안 어드바이저 최종 확인(leaked password protection 등 남은 WARN 처리 여부 검토)
2. 접근성 점검 — 키보드 내비게이션, 스크린리더 라벨, 명도대비
3. 번들 크기·불필요한 재요청 등 경량화, 최종 MVP 마무리 점검

---

## 현재 상태 (이전): 13단계(가져오기/내보내기·백업) 완료

### 구현한 기능
- 거래내역 CSV 내보내기 — `/settings`에서 "거래내역 CSV 내보내기" 클릭 시 삭제되지 않은 전체 거래를 유형·금액·일시·카테고리·고정지출·필수지출·메모 컬럼으로 CSV 생성. 엑셀 한글 깨짐 방지를 위해 BOM 포함, 콤마·따옴표·줄바꿈은 자동 이스케이프 처리(`src/lib/csv.ts`)
- 거래내역 CSV 가져오기 — 이 앱이 내보낸 형식(헤더 일치)만 지원하며, 은행/카드사 원본 CSV 매핑은 범위 밖으로 명시. 카테고리는 `유형:이름` 조합으로 기존 카테고리에 매칭하고, 형식이 잘못되었거나 필수값이 빠진 행은 건너뛰고 건수·사유를 화면에 요약 표시. 모두 새 거래로 추가되며 중복확인은 하지 않음(같은 파일을 두 번 가져오면 중복 등록될 수 있음 — 알려진 제한사항으로 명시)
- 전체 데이터 백업(JSON) 다운로드 — 가정의 주요 15개 테이블(거래·카드·예산·저축/투자·자산/부채·소득시나리오·월마감 등) 전체를 하나의 JSON 파일로 내려받는다. 여러 테이블을 한 번에 복원하는 기능은 참조무결성(FK) 위험 때문에 이번 단계 범위에서 제외하고 화면에 명시적으로 안내함 — 보관·이전용 백업 용도로 한정
- `/settings`에 "가져오기·내보내기·백업" 카드를 새로 추가해 세 기능을 한곳에 모음

### 생성한 파일
`src/lib/csv.ts`, `src/components/settings/ExportTransactionsButton.tsx`, `src/components/settings/ImportTransactionsForm.tsx`, `src/components/settings/BackupDownloadButton.tsx`

### 수정한 파일
`src/app/(dashboard)/settings/page.tsx`(가져오기·내보내기·백업 카드 추가)

### 데이터베이스 변경사항
없음 — 기존 테이블의 데이터를 읽고 쓰는 기능이라 새 테이블·컬럼이 필요 없었다.

### 추가/변경한 패키지
없음 — CSV 파싱/생성 라이브러리 대신 자체 구현한 경량 인코더/디코더(`src/lib/csv.ts`)를 사용했다.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/settings`에서 "거래내역 CSV 내보내기" / "거래내역 CSV 가져오기" / "전체 데이터 백업(JSON) 다운로드" 클릭.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과(오류 없음)
- `npm run build`: 성공, 29개 라우트 전부 정상 생성. 첫 시도에서 `ImportTransactionsForm.tsx`의 미사용 `Button` import로 ESLint 경고 발생 → 제거 후 재빌드해 경고 없이 통과 확인
- `vitest run`: 3/3 통과
- `eslint .`: 통과(경고 없음)

### 알려진 문제
- CSV 가져오기는 이 앱이 내보낸 형식만 지원한다(은행/카드사 원본 CSV 매핑은 이후 과제).
- CSV 가져오기는 추가형이며 중복확인을 하지 않는다 — 같은 파일을 두 번 가져오면 거래가 중복 등록될 수 있다.
- JSON 백업은 다운로드만 지원하고, 여러 테이블을 한 번에 복원하는 기능은 지원하지 않는다(참조무결성 위험 때문에 의도적으로 범위 제외).

### 빌드 용량
`.next` 산출물 규모는 12단계와 유사한 수준(신규 라우트 없이 기존 `/settings`만 확장).

### 다음 단계 준비사항 (14단계 — 요금제 구조·운영자 기능·문의)
1. 요금제 티어(무료/유료) 스키마 및 기능 제한(예: AI 월 사용횟수 실제 차등화)
2. 운영자(admin) 전용 콘솔 — 가정 목록, 사용량, 문의 조회
3. 사용자 문의 접수 화면 및 저장

---

## 현재 상태 (이전): 12단계(PDF 보고서·공유) 완료

### 구현한 기능
- PDF 보고서 — 별도 PDF 생성 라이브러리를 추가하지 않고 브라우저의 인쇄 기능(`window.print()`)으로 "PDF로 저장"을 지원한다. `/reports`에서 "PDF로 저장 / 인쇄" 버튼을 누르면 인쇄 대화상자가 뜨고, "PDF로 저장"을 선택하면 실제 PDF 파일이 만들어진다
- 인쇄 시 사이드바·상단바·모바일 하단탭(`SidebarNav`/`TopBar`/`MobileBottomNav`)이 자동으로 숨겨지고(Tailwind `print:hidden`), 화면에는 없던 보고서 전용 헤더(가정 이름 · "상세 리포트" · 기준일자)가 인쇄용으로만 나타나 깔끔한 보고서 형태로 출력된다
- Web Share API 연동 — "공유하기" 버튼을 누르면 `navigator.share()`로 이번 달 수입·지출·순자산 요약을 기기의 공유 시트(카카오톡 등)로 바로 보낼 수 있다. 지원하지 않는 환경(대부분의 데스크톱 브라우저)에서는 자동으로 클립보드 복사로 대체되고 안내 문구가 표시된다

### 생성한 파일
`src/components/reports/ReportActions.tsx`

### 수정한 파일
`src/app/(dashboard)/reports/page.tsx`(공유 요약 텍스트 생성, 인쇄 전용 헤더 추가), `src/components/layout/{SidebarNav,TopBar,MobileBottomNav}.tsx`(인쇄 시 숨김 처리)

### 데이터베이스 변경사항
없음.

### 추가/변경한 패키지
없음 — jsPDF 등 PDF 생성 라이브러리 대신 브라우저 네이티브 인쇄 기능을 사용해 번들 크기 증가 없이 구현했다.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/reports`에서 "PDF로 저장 / 인쇄" 클릭(인쇄 대화상자에서 "PDF로 저장" 선택) 또는 "공유하기" 클릭.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 첫 시도에서 `"share" in navigator` 타입가드 이후 두 분기 모두 조기 반환하는 구조 때문에 이후 코드에서 `navigator`가 `never`로 좁혀지는 오류 발생 → `canWebShare` 변수로 분리해 수정 후 통과
- `npm run build`: 성공, `/reports` 라우트 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과

### 알려진 문제
- PDF 레이아웃은 브라우저 인쇄 렌더링에 의존한다 — 브라우저별로 여백·줄바꿈이 조금씩 다를 수 있다(별도 PDF 라이브러리로 픽셀 단위까지 통일하지는 않음).
- Web Share API는 대부분 모바일 브라우저에서만 지원된다. 데스크톱에서는 클립보드 복사로 자동 대체되므로 실제 "공유 시트"는 뜨지 않는다(브라우저 표준 동작이며 의도된 폴백).
- 공유 요약에는 이번 달 수입·지출·순자산만 포함되고, 예산·시나리오 등 상세 내용은 포함되지 않는다.

### 빌드 용량
캐시 제외 `.next` 약 5.6MB 수준으로 11단계와 유사.

### 다음 단계 준비사항 (13단계 — 가져오기/내보내기·백업복원)
1. 거래 CSV 내보내기, 은행/카드사 CSV 가져오기(형식 매핑 화면)
2. 가정 데이터 전체 백업(JSON) 생성·다운로드
3. 백업 파일로부터 복원 흐름(중복확인 포함)

---

## 현재 상태 (이전): 11단계(AI 상세권고) 완료

### 구현한 기능
- 서버 전용 AI 연동 — `/api/ai/recommend` Route Handler에서만 AI API를 호출한다. API 키(`AI_API_KEY`)는 서버 환경변수에만 존재하며 클라이언트 번들에는 절대 포함되지 않는다(`src/lib/ai/recommend.ts`에 `"server-only"` 마킹)
- 전달 데이터는 `finance-engine` 계산결과(수입·지출·저축·부채·순자산 등 숫자)와 기본권고 목록뿐 — 카드번호·계좌번호·거래내역 원문 등은 이 객체에 애초에 포함되지 않는 구조라 원천 차단됨(요구사항 33)
- 시스템 프롬프트에 금지사항 명시 — 특정 금융상품 매수·매도·해지 단정 금지, 전달받은 계산값 임의 변경 금지, 참고용 안내 문구 포함, 사실 아닌 내용(금리·상품명 등) 지어내기 금지
- 실제 스키마: `ai_recommendations`(응답 저장, 분석기준기간·시나리오·안내문구 포함), `ai_usage_logs`(가정·사용자별 성공/실패/한도초과 로그) + RLS 전체 적용
- 캐시 — 동일 입력(계산결과 해시 기준)으로 24시간 내 재요청하면 AI를 다시 호출하지 않고 저장된 결과를 재사용해 비용 절감
- 사용량 관리 — 가정당 월 20회로 요청 한도를 두어 남용 방지(실제 요금제별 차등 한도는 14단계에서 다룰 예정), 한도 초과 시 명확한 안내 메시지 표시
- `AI_API_KEY`가 비어 있으면(현재 기본 상태) API 호출 대신 "AI 상세권고 기능이 아직 설정되지 않았습니다" 안내를 반환하도록 설계 — 키를 채우면 코드 변경 없이 바로 동작(2단계의 SMS 연동과 동일한 패턴)
- `/recommendations` 화면의 "AI 상세분석 요청" 버튼을 활성화하고, 페이지를 열면 가장 최근 저장된 AI 응답을 바로 보여주도록 연결

### 생성한 파일
`src/lib/ai/recommend.ts`, `src/app/api/ai/recommend/route.ts`, `src/components/recommendations/AIRecommendationButton.tsx`

### 수정한 파일
`src/app/(dashboard)/recommendations/page.tsx`(버튼 활성화 + 최근 결과 표시), `src/lib/supabase/database.types.ts`(재생성), `.env.local`(`AI_API_KEY`/`AI_MODEL` 안내 주석 보강)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 1건 추가 적용 — `phase11_ai_recommendations_schema`(테이블 2개·RLS·인덱스를 한 마이그레이션에 포함).
테이블 2개 신규(`ai_recommendations`, `ai_usage_logs`). 보안 어드바이저 점검 결과 새로 발생한 경고 없음.

### 추가/변경한 패키지
없음 (Anthropic API를 표준 `fetch`로 직접 호출해 별도 SDK 의존성 없음).

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/recommendations`에서 "AI 상세분석 요청" 클릭. `AI_API_KEY`가 비어 있으면 안내 문구만 표시되며, Anthropic API 키를 `.env.local`에 채우면 실제 AI 응답이 표시된다.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 성공, `/api/ai/recommend` 라우트 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안/성능 어드바이저: 의도되지 않은 경고 0건
- 실제 AI 키가 없는 환경이라 "not_configured" 응답 경로만 코드 리뷰로 확인했고, 실제 Anthropic API 호출 성공 경로는 키가 등록된 이후 사용자가 직접 확인해야 한다(알려진 문제에 기재).

### 알려진 문제
- 이 세션에는 실제 `AI_API_KEY`가 없어 AI 응답이 실제로 오는 경로(정상 응답 파싱, 에러 응답 처리)는 실제 키로 검증되지 않았다 — 코드는 Anthropic Messages API 표준 스펙에 맞춰 작성했으나, 키 등록 후 한 번은 직접 확인이 필요하다.
- 월 20회 한도는 하드코딩된 값이다. 14단계(요금제 구조)에서 요금제별 한도로 교체될 예정.
- AI 응답에 대한 사용자 피드백(도움됨/안됨) 수집 기능은 없다.
- 캐시는 "계산결과가 완전히 동일한 경우"에만 재사용된다 — 거래를 하나만 추가해도 캐시가 무효화되고 새로 호출된다(의도된 동작이지만 비용 측면에서는 보수적).

### 빌드 용량
캐시 제외 `.next` 약 5.6MB 수준으로 10단계와 유사.

### 다음 단계 준비사항 (12단계 — PDF 보고서·공유)
1. `/reports` 화면 내용을 PDF로 내보내는 기능 (서버 렌더링 또는 클라이언트 캡처 방식 검토)
2. Web Share API 연동 — 모바일에서 카카오톡 등으로 PDF·요약 공유
3. 월마감 요약을 포함한 보고서 템플릿 설계

---

## 현재 상태 (이전): 10단계(이미지·PDF 거래등록) 완료

### 구현한 기능
- Supabase Storage 버킷 `receipts`(비공개, 이미지 JPG/PNG/WEBP·PDF만 허용, 최대 10MB) 생성. 경로 규칙 `{household_id}/{uuid}-{파일명}`으로 저장하고, `storage.objects`에 가정 구성원만 업로드·조회·삭제 가능하도록 RLS 정책 적용
- 실제 스키마: `transaction_attachments`(거래에 연결된 영수증 첨부파일) + RLS
- 업로드 → 검토 → 확정 흐름(요구사항) — `/transactions/new/upload`에서 영수증 사진·PDF를 선택하면 즉시 Storage에 업로드되고 첨부 레코드가 생성됨(이 시점엔 거래에 연결되지 않은 상태). 업로드 완료 후 같은 화면에서 기존 거래등록 폼이 나타나 금액·일시·항목 등을 직접 입력해 확정하면, 그 순간 첨부파일이 새로 생성된 거래에 연결됨
- OCR/AI 자동인식은 이번 단계에서 연결하지 않음(화면에 "자동 인식은 이후 단계에서 연결됩니다" 안내 문구 표시) — 실제 AI 분석은 11단계에서 다룸
- 대시보드 홈의 "사진·PDF 등록" 버튼을 비활성 placeholder에서 실제 링크로 전환
- 수입·지출 목록에 영수증이 첨부된 거래는 클립 아이콘이 표시되고, 클릭하면 서버가 60초짜리 서명된 URL을 발급해 새 탭에서 원본을 확인 가능(비공개 버킷이라 URL이 없으면 직접 접근 불가)

### 생성한 파일
`src/components/transactions/PhotoUploadForm.tsx`, `src/app/(dashboard)/transactions/new/upload/page.tsx`, `src/app/api/receipts/[attachmentId]/route.ts`

### 수정한 파일
`src/components/transactions/TransactionForm.tsx`(첨부파일 연결 로직 추가), `src/app/(dashboard)/page.tsx`(버튼 활성화), `src/app/(dashboard)/transactions/page.tsx`(영수증 링크), `src/lib/supabase/database.types.ts`(재생성)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 1건 추가 적용 — `phase10_receipts_storage_and_attachments`(Storage 버킷 생성·`storage.objects` RLS 정책 3종, `transaction_attachments` 테이블·RLS·인덱스를 한 마이그레이션에 포함).
테이블 1개 신규(`transaction_attachments`). 보안 어드바이저 점검 결과 새로 발생한 경고 없음.

### 추가/변경한 패키지
없음 (Supabase Storage는 `@supabase/supabase-js`에 이미 포함).

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/transactions/new/upload`에서 영수증 사진·PDF 업로드 → 거래 정보 입력 후 등록 → `/transactions`에서 클립 아이콘으로 원본 확인.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 첫 시도에서 `PhotoUploadForm.tsx`의 미사용 변수(`Button` import, `file` state) ESLint 경고 발견 → 정리 후 재빌드 성공, `/transactions/new/upload`와 `/api/receipts/[attachmentId]` 라우트 모두 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안/성능 어드바이저: 의도되지 않은 경고 0건

### 알려진 문제
- OCR/AI 기반 자동 인식(금액·날짜·가맹점 자동 추출)은 아직 없다 — 업로드 후 모든 필드를 사용자가 직접 입력해야 한다. 11단계에서 AI 연동 시 자동 인식을 추가할 예정.
- 거래 1건에 첨부파일이 여러 장 있어도 목록에는 첫 번째 파일만 링크로 표시된다.
- 첨부파일 삭제 화면은 없다(거래를 삭제해도 Storage의 원본 파일과 `transaction_attachments` 레코드는 남아 있음) — 정리 기능은 이후 단계 과제로 남겨둔다.
- 거래를 확정하지 않고 업로드만 하고 화면을 벗어나면, 거래에 연결되지 않은 "고아" 첨부파일이 Storage에 남을 수 있다.

### 빌드 용량
캐시 제외 `.next` 약 5.6MB 수준으로 9단계 대비 소폭 증가(업로드 화면·API 라우트 추가분).

### 다음 단계 준비사항 (11단계 — AI 상세권고)
1. 서버 전용 AI 연동 (클라이언트에 API 키 노출 금지, Edge Function 또는 Route Handler에서만 호출)
2. `/recommendations`의 "AI 상세분석 요청" 버튼 활성화, 사용량 관리(요청 제한)
3. 특정 금융상품 매수·매도·해지를 단정적으로 권고하지 않도록 시스템 프롬프트에 금지사항 명시, 계산값은 서버가 이미 계산한 결과만 참고자료로 전달(AI가 임의로 수정 불가)

---

## 현재 상태 (이전): 9단계(월마감·수정삭제이력·알림) 완료

### 구현한 기능
- 실제 스키마: `audit_logs`, `notifications`, `monthly_closings` + RLS 전체 적용, `budgets`에 `last_alert_threshold` 컬럼 추가
- 감사이력 — `transactions`/`budgets`/`cards`/`card_transactions`/`maintenance_fees`/`savings_accounts`/`investments`/`assets`/`liabilities`/`income_scenarios` 10개 핵심 테이블에 제네릭 트리거(`log_audit_event`)를 부착해 등록·수정·삭제(소프트삭제 포함)를 자동 기록. `/settings` 화면에서 최근 30건을 "누가 · 무엇을 · 언제" 형태로 확인 가능(소프트삭제는 "수정"이 아니라 "삭제"로 정확히 표시되도록 before/after의 `deleted_at` 변화를 판별)
- 앱 내부 알림 — 가정 공용 알림함(`/notifications`), 상단바에 읽지 않은 알림 배지 표시. 예산(가정전체·월간) 사용률이 70/90/100% 임계치를 새로 넘을 때 `check_budget_alerts` 트리거가 자동으로 알림을 생성(같은 임계치로 중복 알림 방지)
- 월마감 — `/reports`의 "이번 달 마감하기" 버튼을 누르면 서버의 `close_month()` 함수가 이번 달 수입·지출·저축투자 합계와 최신 순자산 스냅샷을 재집계해 저장(같은 달에 다시 눌러도 최신값으로 갱신), 마감 완료 알림도 함께 생성됨. 최근 6개월 마감 이력을 화면에 표시

### 생성한 파일
`src/lib/audit-labels.ts`, `src/components/notifications/{MarkReadButton,MarkAllReadButton}.tsx`, `src/components/settings/LogoutButton.tsx`, `src/components/reports/CloseMonthButton.tsx`, `src/app/(dashboard)/notifications/page.tsx`

### 수정한 파일
`src/app/(dashboard)/settings/page.tsx`(로그아웃만 있던 화면 → 변경이력 포함, 클라이언트 컴포넌트에서 서버 컴포넌트로 전환), `src/app/(dashboard)/reports/page.tsx`(월마감 섹션 추가), `src/components/layout/TopBar.tsx`(알림 배지), `src/components/layout/nav-config.ts`(알림 메뉴 추가), `src/lib/supabase/database.types.ts`(재생성)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 4건 추가 적용 — `phase9_audit_notifications_schema`, `phase9_functions_triggers`, `phase9_close_month_grant_hardening`, `phase9_fk_index_tuning`.
테이블 3개 신규(`audit_logs`, `notifications`, `monthly_closings`), 함수 3개 신규(`log_audit_event` — 제네릭 감사이력 트리거, `check_budget_alerts` — 예산임계치 알림 트리거, `close_month` — RPC). 보안 어드바이저에서 `close_month`가 `anon` 역할까지 실행 가능하게 노출된 것을 발견해 즉시 회수(다른 RPC와 동일하게 `authenticated`만 허용). 성능 어드바이저에서 `notifications.read_by` FK의 인덱스 누락을 발견해 추가.

### 추가/변경한 패키지
없음.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → 거래 등록 후 `/settings`에서 변경이력 확인, 예산 사용률이 임계치를 넘으면 `/notifications`에서 알림 확인, `/reports`에서 "이번 달 마감하기" 클릭.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 성공, `/notifications` 라우트 정상 생성, 기존 라우트도 모두 정상
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안/성능 어드바이저: `close_month`의 `anon` 노출 1건 발견 즉시 수정, `notifications` FK 인덱스 누락 1건 발견 즉시 수정. 이후 재점검에서 의도되지 않은 경고 0건

### 알려진 문제
- 예산 임계치 알림은 범위가 "가정전체(월간)" 예산에만 적용된다 — 구성원별/카테고리별 등 다른 범위의 예산은 알림이 자동 발송되지 않음(화면에서 사용률 확인은 가능). 요구사항 우선순위상 가장 흔한 범위부터 구현했고, 나머지 범위는 이후 보완 과제.
- 감사이력은 핵심 10개 테이블만 대상이며(요구사항의 "확장 감사로그"는 범위 밖), `household_members`/`categories` 등 부가 테이블 변경은 기록되지 않는다.
- 월마감은 "이번 달"만 가능하고 과거 특정 월을 지정해 마감할 수 없다 — 6단계 자산 스냅샷과 동일한 설계 원칙(항상 현재 시점 기준).
- 알림은 가정 공용이라 개인별 읽음 상태를 구분하지 않는다(한 명이 읽으면 전체가 읽음 처리) — "가족 공동 가계부"라는 제품 성격에 맞춘 의도된 단순화.

### 빌드 용량
캐시 제외 `.next` 약 5.5MB 수준으로 8단계 대비 소폭 증가(알림·변경이력 화면 추가분).

### 다음 단계 준비사항 (10단계 — 이미지·PDF 거래등록)
1. Supabase Storage 버킷 설정 (영수증 이미지·PDF 업로드)
2. 업로드 → (OCR/분석은 이후 AI 연동 전까지 수동 입력 보조) → 검토 → 확정 흐름
3. 거래 등록 화면에 "사진·PDF로 등록" 버튼 연결(현재 비활성 placeholder)

---

## 현재 상태 (이전): 8단계(대시보드·상세그래프) 완료

### 구현한 기능
- `/reports`를 플레이스홀더에서 실제 상세그래프 화면으로 전환(요구사항 37) — 대시보드 홈은 요약카드 6개 + 그래프 1개만 유지하고, 나머지 그래프는 이 화면에 모아 `next/dynamic`으로 지연로딩
- 최근 12개월 수입·지출 추이(라인그래프, 기존 `TrendChart` 재사용)
- 이번 달 카테고리별 지출 비중(도넛 파이차트, 카테고리 고유 색상 사용 + 범례)
- 순자산 추이(6단계에서 저장한 `asset_snapshots` 이력 기반 라인그래프, 순자산/총자산/총부채 3선)
- 진행 중인 예산 사용률(가로 막대그래프, 상태별 색상 — 정상/주의/위험/초과)
- 대시보드 홈의 "상세보기" 링크가 이 화면으로 연결됨(이전 단계에서 이미 연결되어 있던 것을 실제 내용으로 채움)

### 생성한 파일
`src/components/reports/{CategoryBreakdownChart,NetWorthTrendChart,BudgetUsageBarChart}.tsx`

### 수정한 파일
`src/app/(dashboard)/reports/page.tsx`(플레이스홀더 → 실연동)

### 데이터베이스 변경사항
없음 — 기존 `transactions`/`categories`/`asset_snapshots`/`budgets` 테이블을 조회만 한다.

### 추가/변경한 패키지
없음 (recharts는 1단계부터 이미 포함).

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/reports`에서 4개 그래프 확인. 데이터가 없는 그래프는 안내 문구를 표시한다.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과 (`noUncheckedIndexedAccess` 설정 때문에 배열 인덱싱 결과가 `string | undefined`로 추론되는 문제가 있어 fallback 색상을 명시적으로 추가해 수정)
- `npm run build`: 처음에는 서버 컴포넌트(`page.tsx`)에서 `next/dynamic`에 `ssr: false`를 직접 넘겨 Next 15의 "서버 컴포넌트에서 ssr:false 금지" 오류가 발생 → `ssr: false` 옵션을 제거(코드 스플리팅은 유지하되 SSR은 그대로 허용)해 해결. 이후 성공, `/reports` 라우트 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과

### 알려진 문제
- 그래프에 표시되는 값은 화면을 열 때마다 서버에서 다시 계산한다(캐싱 없음) — 예산 화면과 동일한 수준의 알려진 제한.
- 카테고리별 지출 비중은 이번 달만 보여준다. 기간 선택(지난달/분기별 등)은 아직 없음.
- PDF로 내보내는 기능은 아직 없음(12단계 예정) — 지금은 화면에서만 확인 가능.

### 빌드 용량
캐시 제외 `.next` 약 5.3MB 수준으로 7단계 대비 소폭 증가(그래프 컴포넌트 3개 추가분, recharts 파이/바 차트 관련 코드 포함).

### 다음 단계 준비사항 (9단계 — 월마감·수정삭제이력·알림)
1. `audit_logs`, `notifications` 테이블 마이그레이션
2. 거래·예산·자산 등 주요 테이블 변경 시 감사이력 자동 기록(트리거)
3. 예산 임계치 도달, 월마감 등 상황에서 앱 내 알림 생성·목록 화면

---

## 현재 상태 (이전): 7단계(미래수입 시나리오·계산엔진 통합) 완료

### 구현한 기능
- 실제 스키마: `income_scenarios` + RLS 전체 적용. 유형 6종(현재 직장 유지/이직/퇴사 후 구직 중/배우자 소득만/부업 병행/은퇴·연금 수령 후)
- 시나리오 등록 — 이름·유형·적용 시작일·예상 월수입·메모
- 시나리오 적용/해제 — 가정당 활성 시나리오는 항상 1개만 유지되도록 부분 유니크 인덱스(`income_scenarios_one_active_per_household`)로 강제하고, 활성화/비활성화는 각각 `activate_income_scenario`/`deactivate_income_scenarios` SECURITY DEFINER 함수로 원자적으로 처리(클라이언트의 직접 갱신으로 인한 동시성 문제 방지)
- 대시보드 홈과 기본권고 화면 모두 활성 시나리오가 있으면 해당 시나리오 이름과 "변경" 링크를 상단에 표시, 기본권고 화면에는 계산기준(기간·적용 시나리오)을 함께 노출(요구사항 31)
- `finance-engine`의 `scenarioId`/`projectedMonthlyIncome`이 활성 시나리오의 실제 값으로 연결되어, 시나리오를 적용/해제하면 대시보드·기본권고 계산 결과가 즉시 갱신됨
- 시나리오도 소프트 삭제, 본인 작성분은 누구나·전체는 관리자 이상 삭제 가능(RLS)

### 생성한 파일
`src/lib/income-scenario-labels.ts`, `src/components/scenarios/{IncomeScenarioForm,ScenarioActions}.tsx`

### 수정한 파일
`src/app/(dashboard)/income-scenarios/page.tsx`(플레이스홀더 → 실연동), `src/app/(dashboard)/page.tsx`, `src/app/(dashboard)/recommendations/page.tsx`, `src/lib/finance-engine/load-monthly-summary.ts`, `src/lib/supabase/database.types.ts`(재생성)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 2건 추가 적용 — `phase7_income_scenarios_schema`(테이블·부분 유니크 인덱스·RLS·트리거·FK 인덱스를 한 마이그레이션에 포함), `phase7_activate_scenario_function`(두 RPC 함수 + 권한 강화).
테이블 1개 신규(`income_scenarios`), 함수 2개 신규(`activate_income_scenario`, `deactivate_income_scenarios`). 보안·성능 어드바이저 점검 결과 새로 발생한 경고 없음(기존과 동일한 의도된 RPC 경고만 남음).

### 추가/변경한 패키지
없음.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/income-scenarios`에서 시나리오 등록 후 "이 시나리오 적용" 클릭 → 대시보드·기본권고에서 반영 확인.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 성공, `/income-scenarios` 라우트 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안/성능 어드바이저: 의도되지 않은 경고 0건

### 알려진 문제
- 시나리오 수정 화면은 없음(삭제 후 재등록 방식) — 이전 단계의 다른 등록형 화면들과 동일한 수준.
- 시나리오별 상세 시뮬레이션(예: 몇 개월 후 자산이 바닥나는지)은 아직 없음 — 현재는 활성 시나리오의 예상 월수입 하나만 계산엔진에 반영된다. 더 정교한 다개월 시뮬레이션은 이후 단계 과제로 남겨둔다.
- 시나리오 전환 이력(언제 어떤 시나리오를 적용했는지) 기록은 없음 — 9단계(월마감·이력·알림)에서 감사로그와 함께 고려 예정.

### 빌드 용량
캐시 제외 `.next` 약 5.1MB 수준으로 6단계와 유사.

### 다음 단계 준비사항 (8단계 — 대시보드·상세그래프)
1. Recharts 기반 상세 그래프 화면(`/reports` 고도화) — 카테고리별 지출 비중, 기간별 추이, 자산 추이
2. 대시보드 홈의 요약카드에서 상세 리포트로의 진입 동선 정리

---

## 현재 상태 (이전): 6단계(저축·투자·자산·부채) 완료

### 구현한 기능
- 실제 스키마: `savings_accounts`, `investments`, `assets`, `liabilities`, `asset_snapshots` + RLS 전체 적용
- 저축 등록 — 상품명·금융기관·월납입액·현재잔액·목표금액·금리·가입일/만기일/명의자, 목표금액 설정 시 달성률 막대그래프 표시
- 투자 등록 — 종목/상품명·유형(국내외주식/ETF/펀드/채권/연금/가상자산 등)·원금·평가액(사용자 직접입력, 자동연동 없음, 요구사항 25)·매수일/평가기준일, 손익금액·수익률 표시
- 자산 등록 — 현금성/투자성/실물 3분류 아래 세부 종류 선택(적금/청약/부동산/차량 등), 취득가·평가액·명의자·공동여부
- 부채 등록 — 종류(주담대/전세대출/신용대출/할부 등)·원금·잔액·금리·월상환액·상환일·만기일·채무자
- 순자산 요약 카드 — 총자산(자산 테이블 + 저축잔액 + 투자평가액 합계) − 총부채 = 순자산을 화면에서 자동 계산
- 월별 자산 스냅샷 — "이번 달 스냅샷 저장" 버튼을 누르면 서버의 `save_asset_snapshot()` 함수가 그 시점의 자산·부채를 직접 재집계해 저장(클라이언트가 계산한 값을 신뢰하지 않음), 같은 달에 다시 누르면 최신값으로 갱신, 최근 12개월 이력 표시
- `finance-engine`의 `totalAssets`/`totalLiabilities`/`totalAssetsCash`/`savingsTargetTotal`/`savingsCurrentTotal`/`debtMonthlyPaymentTotal`이 모두 실제 데이터로 연결되어 대시보드의 "가족 순자산" 카드가 실제 값을 반영

### 생성한 파일
`src/lib/asset-labels.ts`, `src/components/savings/{SavingsAccountForm,InvestmentForm,DeleteSavingsButton}.tsx`, `src/components/assets/{AssetForm,LiabilityForm,DeleteAssetButton,SaveSnapshotButton}.tsx`

### 수정한 파일
`src/app/(dashboard)/savings-investments/page.tsx`, `src/app/(dashboard)/assets-liabilities/page.tsx`(둘 다 플레이스홀더 → 실연동), `src/lib/finance-engine/load-monthly-summary.ts`, `src/lib/supabase/database.types.ts`(재생성)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 3건 추가 적용 — `phase6_savings_investments_assets_liabilities_schema`, `phase6_rls_triggers_snapshot_function`, `phase6_fk_index_tuning`.
테이블 5개 신규, 함수 1개 신규(`save_asset_snapshot` — SECURITY DEFINER, 클라이언트에서 직접 insert/update 불가하도록 `asset_snapshots`에는 SELECT 정책만 두고 쓰기는 이 함수로만 가능하게 강제). 신규 FK 전체에 인덱스 추가. 보안·성능 어드바이저 점검 결과 새로 발생한 경고 없음.

### 추가/변경한 패키지
없음.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/savings-investments`에서 저축·투자 등록, `/assets-liabilities`에서 자산·부채 등록 후 "이번 달 스냅샷 저장" 클릭.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 성공, `/savings-investments`, `/assets-liabilities` 라우트 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안/성능 어드바이저: 의도되지 않은 경고 0건

### 알려진 문제
- 저축·투자·자산·부채 모두 수정 화면은 없음(삭제 후 재등록 방식) — 3~5단계의 다른 등록형 화면들과 동일한 수준.
- `visibility`(공개범위) 컬럼은 저장만 되고 RLS에서 실제로 필터링하지는 않는다 — 지금은 가정 구성원이면 전부 조회 가능(4단계 카드와 동일한 방식의 알려진 제한사항). 세밀한 공개범위 제어는 이후 단계 과제로 남겨둔다.
- `AssetSnapshot`의 구성원별 자산 분해(`byMember`)는 아직 구현하지 않음 — 스냅샷은 가정 전체 합계만 저장한다.
- 순자산 계산에서 저축계좌의 월납입액(`monthlyContribution`)은 아직 어디에도 집계되지 않는다 — 저축 자체를 지출로 기록하려면 3단계의 거래 등록(`saving` 유형)을 병행해야 한다.

### 빌드 용량
캐시 제외 `.next` 약 5.1MB 수준으로 5단계와 유사.

### 다음 단계 준비사항 (7단계 — 미래수입 시나리오 + 규칙기반 계산엔진 통합)
1. `income_scenarios` 테이블 마이그레이션
2. 시나리오 등록·선택 화면, `finance-engine`에 `projectedMonthlyIncome` 실데이터 연결
3. 대시보드·기본권고 화면에서 시나리오 선택에 따라 계산결과가 갱신되도록 연결

---

## 현재 상태 (이전): 5단계(예산) 완료

### 구현한 기능
- 실제 스키마: `budgets` + RLS 전체 적용. 범위(scope) 7종 지원 — 가정전체(월간)/구성원별/카테고리별/고정지출/변동지출/주간/일간
- 예산 등록 — 범위 선택 시 대상(구성원·카테고리)과 기본 기간(월/주/일)이 자동으로 맞춰지고, 기간·한도금액·알림 임계치(기본 70/90/100%)를 직접 조정 가능
- 예산 목록에 사용률 막대그래프 + 상태 배지(정상/주의/위험/초과, 색상과 문자·아이콘을 함께 사용해 색맹 등 접근성 고려) 표시
- 사용액 계산은 예산 범위별로 해당하는 거래만 집계 — 저축·투자·계좌이동은 소비지출이 아니므로 제외, 카테고리 예산은 해당 카테고리만, 구성원 예산은 실사용자가 해당 구성원인 거래만 집계(요구사항 17 원칙 재사용)
- `finance-engine`의 `budgetLimitTotal`이 오늘 날짜가 기간에 포함되는 가정전체(월간) 예산의 실제 한도 합계로 연결되어 대시보드의 예산초과금액 계산에 반영됨
- 예산도 소프트 삭제, 본인 작성분은 누구나·전체는 관리자 이상 삭제 가능(RLS)

### 생성한 파일
`src/lib/budget-labels.ts`, `src/components/budget/{BudgetForm,DeleteBudgetButton}.tsx`

### 수정한 파일
`src/app/(dashboard)/budget/page.tsx`(플레이스홀더 → 실연동), `src/lib/finance-engine/load-monthly-summary.ts`, `src/lib/supabase/database.types.ts`(재생성)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 1건 추가 적용 — `phase5_budgets_schema` (테이블 생성·RLS 정책·트리거·인덱스를 한 마이그레이션에 포함).
테이블 1개 신규(`budgets`). 보안·성능 어드바이저 점검 결과 새로 발생한 경고 없음(기존과 동일한 의도된 RPC 경고만 남음).

### 추가/변경한 패키지
없음.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/budget`에서 범위를 선택해 예산 등록 → 목록에서 사용률·상태 확인.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 성공, `/budget` 라우트 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안/성능 어드바이저: 의도되지 않은 경고 0건

### 알려진 문제
- 예산 수정 화면은 없음(삭제 후 재등록 방식) — 3~4단계의 다른 등록형 화면들과 동일한 수준.
- 알림 임계치에 도달했을 때 실제 알림(요구사항의 `budget_70`/`budget_90`/`budget_exceeded`)을 발송하는 기능은 아직 없음 — 9단계(월마감·이력·알림)에서 연결 예정. 지금은 예산 화면에서 배지로만 확인 가능.
- 목록의 사용액 계산은 화면을 열 때마다 서버에서 다시 계산한다(캐싱 없음). 예산 개수가 많아지면 다음 단계에서 최적화 고려.

### 빌드 용량
캐시 제외 `.next` 약 5.0MB 수준으로 4단계와 유사.

### 다음 단계 준비사항 (6단계 — 저축·투자·자산·부채)
1. `savings_accounts`, `investments`, `assets`, `liabilities`, `asset_snapshots` 테이블 마이그레이션
2. 등록·조회 화면, 순자산 자동계산
3. finance-engine의 `totalAssets`/`totalLiabilities`/`totalAssetsCash`/`savingsTargetTotal`/`savingsCurrentTotal`/`debtMonthlyPaymentTotal`을 실제 데이터로 연결

---

## 현재 상태 (이전): 4단계(카드·관리비) 완료

### 구현한 기능
- 실제 스키마: `cards`, `card_transactions`, `maintenance_fees`, `maintenance_fee_items` + RLS 전체 적용
- 카드 등록 — 별칭·발급사·종류(신용/체크)·뒤 4자리·결제일·월한도·주사용자·공동사용 여부. 카드 전체번호·CVC·비밀번호는 컬럼 자체가 없어 원천 차단(요구사항 21)
- 카드 상세 화면에서 사용내역 등록 — 일시불/할부(개월수·월수수료), 항목·실사용자 지정, 결제일 기준으로 최초 청구월을 자동 추정하되 사용자가 직접 수정 가능
- 카드 목록·상세에 "이번 달 청구예정액" 표시 — 할부 구간에 걸친 거래는 해당 월 회차 금액만 반영, 카드대금 정산(`card_settlement`)과는 별개로 집계해 이중계산하지 않음(요구사항 17)
- 관리비 등록 — 월별 총액 입력 또는 세부항목(일반관리비/청소비/전기료 등 15종) 입력, 세부항목 입력 시 총액은 DB 트리거로 항목합계에 자동 동기화(이중계산 방지)
- 관리비 이력 목록에 전월 대비 증감(▲▼) 표시로 변화 확인
- 카드/관리비 모두 소프트 삭제, 본인 작성분은 누구나·전체는 관리자 이상 삭제 가능(RLS)
- `finance-engine`의 `upcomingCardBilling`이 실제 카드거래 데이터로 계산되도록 연결

### 생성한 파일
`src/lib/card-labels.ts`, `src/app/(dashboard)/cards/[id]/page.tsx`, `src/components/cards/{CardForm,CardTransactionForm,DeleteCardButton,DeleteCardTransactionButton}.tsx`, `src/components/maintenance/{MaintenanceFeeForm,DeleteMaintenanceFeeButton}.tsx`

### 수정한 파일
`src/app/(dashboard)/cards/page.tsx`, `src/app/(dashboard)/maintenance-fee/page.tsx`(플레이스홀더 → 실연동), `src/lib/finance-engine/load-monthly-summary.ts`, `src/lib/supabase/database.types.ts`(재생성)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 5건 추가 적용 — `phase4_cards_maintenance_schema`, `phase4_rls_and_triggers`, `phase4_trigger_function_hardening`, `phase4_fk_index_tuning`, `phase4_fix_maintenance_items_policy_overlap`.
테이블 4개 신규(`cards`, `card_transactions`, `maintenance_fees`, `maintenance_fee_items`), 함수 1개 신규(`sync_maintenance_fee_total`, 세부항목 합계를 총액에 자동 반영). 신규 FK 전체에 인덱스 추가. 보안 어드바이저 점검 후 트리거 함수 실행권한 회수, 성능 어드바이저에서 발견된 `maintenance_fee_items`의 정책 중복(SELECT 액션에 두 정책이 겹치던 문제)도 분리해 수정 완료.

### 추가/변경한 패키지
없음.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → `/cards`에서 카드 등록 → 카드 클릭해 상세에서 사용내역 등록 → `/maintenance-fee`에서 관리비 등록.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과 (database.types.ts의 헬퍼 타입에서 스키마 인덱싱 오류가 한 번 발생해 원래 Supabase 생성기 패턴대로 수정 후 통과)
- `npm run build`: 성공, `/cards`, `/cards/[id]`, `/maintenance-fee` 라우트 정상 생성
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- Supabase 보안/성능 어드바이저: 의도되지 않은 경고 0건

### 알려진 문제
- 카드 청구월 추정은 "이용일 ≤ 결제일이면 이용월 청구, 아니면 다음 달 청구"로 단순화한 규칙이다. 카드사별 실제 매입마감일과 다를 수 있어 사용자가 직접 수정하는 구조로 보완했다.
- 카드 목록/상세에 카드 자체 수정(발급사·결제일 변경 등) 화면은 없음 — 등록·삭제만 가능.
- 관리비 세부항목 수정 화면은 없음(삭제 후 재등록 방식).

### 빌드 용량
캐시 제외 `.next` 약 5.0MB 수준으로 3단계와 유사, 정적 청크 소폭 증가(카드/관리비 폼 컴포넌트 추가분).

### 다음 단계 준비사항 (5단계 — 예산)
1. `budgets` 테이블 마이그레이션 (범위: 가정전체/구성원/카테고리/고정지출/변동지출/주간/일간)
2. 예산 등록·수정 화면, 알림 임계치(70/90/100%) 설정
3. finance-engine의 `budgetLimitTotal`/`budgetExceededAmount`를 실제 예산 데이터로 연결

---

## 현재 상태 (이전): 3단계(수입·지출 핵심) 완료

### 구현한 기능
- 실제 스키마: `categories`, `transactions`, `recurring_transactions` + RLS 전체 적용
- 가정 생성 시 기본 카테고리(주거비/식비/교통비/통신비/의료비/교육비/여가/기타 등)를 자동 시딩하는 훅
- 거래 등록/수정/삭제 화면 실연동 — 유형(수입/생활지출/부채이자 등)·금액·일시·카테고리·고정비 여부·필수 여부·메모 입력, 본인 작성 거래는 누구나, 전체 거래는 관리자 이상만 수정·삭제 가능(RLS로 강제)
- 삭제는 2단계 확인 후 소프트 삭제(`deleted_at`)
- 반복거래(고정비 템플릿) 등록 화면 — 월급·보험료·통신비 등을 등록해두면 "이번 달 생성" 버튼 한 번으로 해당 월 거래를 자동 생성 (`generate_due_recurring_transactions` DB 함수, 중복 생성 방지)
- 수입·지출 목록 화면이 실제 DB 데이터를 표시 (최근 50건, 카테고리 조인)
- 대시보드 홈이 실제 이번 달 거래로 계산한 요약카드 6개 + 최근 6개월 수입·지출 그래프 + 규칙기반 권고를 표시 (mock 데이터 전면 교체)
- `기본권고` 화면도 실제 데이터 기반으로 전환 (AI 상세권고는 여전히 비활성 placeholder, 11단계 예정)

### 생성한 파일
`src/lib/supabase/current-household.ts`, `src/lib/transaction-labels.ts`, `src/lib/finance-engine/load-monthly-summary.ts`, `src/app/(dashboard)/transactions/new/page.tsx`, `src/app/(dashboard)/transactions/[id]/edit/page.tsx`, `src/app/(dashboard)/transactions/recurring/page.tsx`, `src/components/transactions/{TransactionForm,DeleteTransactionButton,RecurringForm,GenerateRecurringButton}.tsx`

### 수정한 파일
`src/app/(dashboard)/page.tsx`, `src/app/(dashboard)/recommendations/page.tsx`, `src/app/(dashboard)/transactions/page.tsx`, `src/lib/supabase/database.types.ts`(재생성)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 4건 추가 적용 — `phase3_categories_transactions_schema`, `phase3_rls_and_triggers`, `phase3_default_categories_and_household_hook`, `phase3_fk_index_tuning`.
테이블 3개 신규(`categories`, `transactions`, `recurring_transactions`), 함수 2개 신규(`generate_due_recurring_transactions`, `seed_default_categories`). 신규 FK 전체에 인덱스 추가 완료.

### 추가/변경한 패키지
없음 (2단계에서 정리한 의존성 그대로 사용).

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000` → 로그인 → `/transactions/new`에서 거래 등록, `/transactions/recurring`에서 반복거래 등록.

### 테스트방법
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx eslint .
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `tsc --noEmit`: 통과
- `npm run build`: 성공, 모든 라우트 정상 생성 (`(dashboard)` 그룹의 transactions/recurring, recommendations, page 포함)
- `vitest run`: 3/3 통과
- `eslint .`: 통과
- 빌드 산출물(캐시 제외): 약 5.0MB, 정적 청크 약 1.9MB — 2단계 대비 큰 증가 없음

### 알려진 문제
- 거래 목록에 검색·기간필터·페이지네이션 없음 (최근 50건만 표시) — 다음 단계 이후 고도화 예정
- 반복거래 생성은 수동 버튼 클릭 방식 (자동 스케줄링은 없음, 요구사항상 의도된 동작)
- 사진·PDF로 거래 등록은 버튼만 있고 비활성 (10단계 예정)

### 다음 단계 준비사항 (4단계 — 카드·관리비)
1. `cards`, `card_transactions`, `maintenance_fees` 테이블 마이그레이션
2. 카드 등록/카드별 지출 집계, 관리비 등록·분담 화면
3. finance-engine에 `upcomingCardBilling` 실데이터 연결

---

## 현재 상태 (이전): 2단계(인증·가정) 완료

### 구현한 기능
- Supabase 프로젝트 `gagyebu` 생성 및 연결 (조직 "생산기술", 리전 ap-northeast-2 서울)
- 실제 스키마: `user_profiles`, `households`, `household_members`, `household_invitations`, `phone_verifications` + RLS 전체 적용
- 가정 생성/참여를 원자적으로 처리하는 DB 함수(`create_household`, `join_household_with_code`) — 클라이언트가 직접 여러 테이블에 쓰지 않고 서버 검증을 거치도록 설계
- 회원가입(이메일) → 이메일 인증 링크 → `/auth/callback`에서 세션 교환 → 대시보드 진입 시 가정 없으면 자동으로 `/household/new`로 안내
- 로그인/로그아웃, 비밀번호 재설정(이메일 전용, 휴대폰은 SMS 연동 전까지 안내문구만), 새 비밀번호 설정 화면
- 미들웨어로 전체 라우트 세션 게이팅 (`/login` 등 공개 경로 제외 전부 인증 필요), 서버 레이아웃에서 이중 검증(가정 미소속 시 온보딩으로)
- 가족관리 화면이 실제 DB의 구성원 목록을 표시, 관리자 이상은 초대코드 생성 가능(7일 유효, RLS로 권한 강제)
- 대시보드 상단바가 로그인한 사용자의 실제 가정 이름을 표시

### 생성한 파일
`src/lib/supabase/{client,server,middleware,database.types}.ts`, `middleware.ts`(루트), `src/app/auth/callback/route.ts`, `src/app/update-password/page.tsx`, `src/components/household/CreateInvitationButton.tsx`

### 수정한 파일
`src/app/(auth)/{layout,login,signup,verify-email,reset-password}/page.tsx`, `src/app/(onboarding)/{layout,household/new,household/join}/page.tsx`, `src/app/(dashboard)/{layout,settings,household}/page.tsx`, `src/components/layout/TopBar.tsx`, `package.json`, `.env.local`(신규, git 제외)

### 데이터베이스 변경사항 (Supabase 프로젝트: gagyebu / ryupakeblibciijlkrgq)
마이그레이션 6건 적용 — `phase2_core_schema`, `phase2_functions_triggers`, `phase2_rls_policies`, `phase2_rpc_grants_hardening`, `phase2_rpc_grants_hardening_2`, `phase2_performance_tuning`.
테이블 5개(위 참고), 뷰 0개, 함수 6개(`create_household`, `join_household_with_code`, `is_household_member`, `household_role`, `handle_new_user`, `set_updated_at`), 트리거 3개. Supabase 보안 어드바이저(`get_advisors`)로 점검해 anon 권한 과다 노출을 모두 제거했고, 남은 경고는 "로그인한 사용자가 이 함수를 호출할 수 있다"는 의도된 동작에 대한 것뿐이다. 성능 어드바이저의 auth.uid() 반복평가 경고도 모두 수정.

### 추가/변경한 패키지
- `@supabase/ssr`을 `^0.5.0` → `^0.12.3`으로 상향 — 설치 시점 최신 `@supabase/supabase-js`(2.110.7)와 `^0.5.0`이 내부적으로 서로 다른 타입 경로를 참조해 `Database` 제네릭이 깨지는 문제를 발견해 수정.
- `lucide-react`를 `^0.460.0` → `^1.25.0`으로 상향 — 0.460.0에는 타입 선언 파일이 없어 전 화면에서 타입 오류가 발생했음을 확인해 수정.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000`

### ⚠ 실행 전 반드시 해야 하는 수동 설정 (Supabase 대시보드)
MCP로 접근 가능한 범위 밖이라 직접 해줘야 한다.
1. Supabase 대시보드 → gagyebu 프로젝트 → Authentication → URL Configuration
2. **Site URL**: `http://localhost:3000` (배포 후에는 실제 도메인으로 변경)
3. **Redirect URLs**에 `http://localhost:3000/auth/callback` 추가
이걸 안 하면 회원가입 이메일 인증 링크와 비밀번호 재설정 링크가 동작하지 않는다.

### 테스트방법
```bash
npm run typecheck
npm run build
npm run test
npm run lint
```
실제 동작 확인: `npm run dev` 후 `/signup`으로 가입 → 받은 이메일의 링크 클릭 → 로그인 → `/household/new`로 자동 이동 → 가정 생성 → 대시보드 진입 확인.

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `npm run typecheck`: 통과
- `npm run build`: 성공, 21개 라우트 생성 (동적 라우트가 늘어 대부분 `ƒ`(서버 렌더)로 전환됨 — 인증 확인이 각 요청마다 필요해졌기 때문. 정상)
- `npm run test`: 3/3 통과
- `npm run lint`: 통과
- Supabase 보안/성능 어드바이저: 의도되지 않은 경고 0건

### 알려진 문제
- 휴대폰 인증은 여전히 구조만 있고 실제 SMS 발송은 연결 안 됨 (계획대로, SMS 실연동은 후반 단계).
- 가족관리 화면에서 권한변경·구성원삭제·소유권이전은 아직 없음 (버튼 자체를 만들지 않음 — 원칙 5 준수).
- 초대코드 생성은 되지만 "초대 취소", "유효기간 직접 지정"은 아직 없음.
- Supabase 무료 플랜은 7일 이상 비활성 시 프로젝트가 자동 일시정지될 수 있다. 그 경우 다음 세션에서 `get_project`로 상태 확인 후 필요시 재개해야 한다.

### 빌드 용량 변화
1단계(102kB 공유 청크) 대비 공유 청크는 동일. 로그인/회원가입 페이지가 Supabase 클라이언트 번들 포함으로 132kB → 198~199kB로 증가 (react-hook-form + supabase-js 클라이언트 번들).

### 추가 반영 (2단계 이후 요청사항)
- 앱 내 "사용 설명서"(`/manual`) 추가 — 시작하기, 권한 안내, 메뉴별 사용가능/준비중 표시, FAQ. 사이드바 "가정" 그룹에 링크 추가.
- 버그 수정: Supabase에서 "Confirm email"을 꺼둔 경우 회원가입 즉시 세션이 생기는데, 기존 코드는 무조건 `/verify-email`로 보내던 문제를 수정 — 이제 세션 유무를 확인해 바로 로그인 처리한다.
- 개발 편의: Supabase 대시보드에서 이메일 인증(Confirm email)을 꺼두면 테스트 가입 시 메일 확인 없이 즉시 로그인된다. **배포 전 다시 켜야 함.**

### 다음 단계 준비사항 (3단계 — 수입·지출 핵심)
1. `transactions`, `categories`, `recurring_transactions` 테이블 마이그레이션
2. 카테고리 기본값 시딩(주거비/식비/교통비 등, 요구사항 19)
3. 거래 등록/수정/삭제 폼을 실제 DB와 연결, 대시보드의 mock 데이터를 실제 조회로 교체
4. `finance-engine`이 실제 거래 데이터를 입력받도록 연결

---

## 단계 이력

| 단계 | 상태 | 완료일 |
|---|---|---|
| 설계 문서 (ARCHITECTURE.md) | 완료 | 2026-07-21 |
| 1단계 — 스캐폴딩 | 완료 | 2026-07-21 |
| 2단계 — 인증·가정 | 완료 | 2026-07-21 |
| 3단계 — 수입·지출 핵심 | 완료 | 2026-07-21 |
| 4단계 — 카드·관리비 | 완료 | 2026-07-21 |
| 5단계 — 예산 | 완료 | 2026-07-21 |
| 6단계 — 저축·투자·자산·부채 | 완료 | 2026-07-21 |
| 7단계 — 미래수입 시나리오·계산엔진 | 완료 | 2026-07-21 |
| 8단계 — 대시보드·상세그래프 | 완료 | 2026-07-21 |
| 9단계 — 월마감·이력·알림 | 완료 | 2026-07-21 |
| 10단계 — 이미지·PDF 거래등록 | 완료 | 2026-07-21 |
| 11단계 — AI 상세권고 | 완료 | 2026-07-21 |
| 12단계 — PDF 보고서·공유 | 완료 | 2026-07-21 |
| 13단계 — 가져오기/내보내기·백업복원 | 예정 | - |
| 14단계 — 요금제·운영자·문의 | 예정 | - |
| 15단계 — 보안·접근성·경량화 마무리 | 예정 | - |
