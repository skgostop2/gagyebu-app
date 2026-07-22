# 진행상황

마지막 업데이트: 2026-07-21 (1단계 완료)

다음 세션은 이 파일부터 읽고 시작한다.

---

## 현재 상태: 1단계(스캐폴딩) 완료

### 구현한 기능
- 반응형 셸: 모바일 하단탭 5개 / PC 좌측 사이드바(그룹화) / 공통 상단바
- SF 다크테마 디자인시스템 (Tailwind v4 `@theme` 토큰), 라이트모드 전환 여지 포함
- 전체 데이터 타입 정의 (`src/lib/types`) — 요구사항 64의 테이블 구조 전체 대응
- 규칙기반 계산엔진 (`src/lib/finance-engine/calculations.ts`) — 실제로 동작함(목업데이터 기준), 단위테스트 3건 통과
- 기본 자동권고 생성기 (`src/lib/finance-engine/recommendations.ts`) — 요구사항 32의 8단계 우선순위 반영
- SMS 발송 인터페이스 + Mock 구현체 (`src/lib/sms`) — 공급자 교체 가능 구조, 서버 전용(`server-only`)
- 화면: 로그인/회원가입(비밀번호 표시·숨김, 강도표시, 약관동의)/이메일인증안내/비밀번호재설정(이메일·휴대폰 탭, 계정노출방지 공통문구)/가정생성/가정참여/대시보드홈(핵심카드6개+그래프1개+권고3개)/거래목록(목업)/가족관리(목업)/그 외 9개 상세화면(자리표시자, 몇 단계에서 연결되는지 명시)

### 생성한 파일 (51개)
설정: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`, `README.md`, `ARCHITECTURE.md`
소스: `src/app/**`(라우트 20개), `src/components/**`(13개), `src/lib/**`(types/utils/finance-engine/sms/mock-data/validation, 12개)
전체 목록은 저장소 트리 참고.

### 수정한 파일
없음 (신규 프로젝트)

### 데이터베이스 변경사항
없음. 실제 Supabase 스키마·RLS는 2단계에서 SQL 마이그레이션으로 만든다. `src/lib/types`가 그 설계의 기준안이다.

### 추가한 패키지 (package.json 반영, 실제 설치는 사용자가 `npm install`)
next, react, react-dom, @supabase/supabase-js, @supabase/ssr, @tanstack/react-query, react-hook-form, zod, @hookform/resolvers, recharts, date-fns, lucide-react, server-only / (dev) typescript, tailwindcss, @tailwindcss/postcss, eslint, eslint-config-next, @eslint/eslintrc, vitest

**패키지 추가 이유**: ARCHITECTURE.md 10번 항목(예상 패키지 표)에 확정한 목록 그대로 반영. Supabase·react-query·sms는 2단계부터 실제로 쓰이지만, 타입/구조가 이 패키지들을 전제로 설계되어 있어 1단계에 미리 등록. 동일 목적 라이브러리 중복 방지를 위해 이 표를 프로젝트 전체의 고정 목록으로 유지한다.

### 실행방법
```bash
npm install
npm run dev
```
`http://localhost:3000`

### 테스트방법
```bash
npm run typecheck   # 타입 검사
npm run build        # 프로덕션 빌드
npm run test          # finance-engine 단위테스트
npm run lint            # ESLint
```

### 테스트결과 (샌드박스에서 실제 실행하여 검증함)
- `npm run typecheck`: 통과 (오류 0건)
- `npm run build`: 성공, 21개 라우트 전부 정적 생성. 홈 대시보드 First Load JS 208kB, 그 외 상세페이지는 대부분 102kB(공유 청크 102kB + 페이지별 156B~2.6kB)
- `npm run test`: 3/3 통과 (계좌이동 제외, 대출이자/원금 구분, 미래수입 부족금 계산 검증)
- `npm run lint`: 통과 (오류 0건)

### 알려진 문제
- 실제 로그인 없이 대시보드가 바로 보임 — 2단계에서 인증 게이트(middleware)로 연결 예정. 지금은 화면 구조 확인용.
- 대시보드·거래목록·가족관리 외 9개 상세화면은 자리표시자 상태 — 원칙 5(빈 화면 금지)를 지키기 위해 "몇 단계에서 연결되는지" 화면에 명시해 둠.
- 회원가입/로그인 폼 제출은 콘솔 로그만 남기고 실제 인증으로 이어지지 않음.
- `manifest.json`에 아이콘 이미지가 비어있음 — 실제 PWA 설치 아이콘은 디자인 확정 후 추가.
- 로컬 개발 시 `next-env.d.ts`는 `npm run dev` 최초 실행 시 자동 생성됨(정상 동작, 저장소에는 포함 안 함).

### 빌드 용량 변화
신규 프로젝트 기준 최초 측정값: 공유 청크 102kB, 홈 대시보드 First Load JS 208kB(recharts 포함). 다음 단계부터 이 값을 기준선으로 증가폭을 추적한다.

### 다음 단계 준비사항
2단계(인증·가정)를 시작하려면 다음이 필요하다.
1. Supabase 프로젝트 URL/키를 `.env.local`에 입력 (`.env.example` 참고)
2. `src/lib/types`를 기준으로 Supabase SQL 마이그레이션 작성 (households, household_members, household_invitations, user_profiles, phone_verifications 등) + RLS 정책
3. `src/app/(auth)`, `src/app/(onboarding)`의 mock 제출 로직을 실제 Supabase Auth 호출로 교체
4. 인증 상태에 따른 라우트 보호(middleware) 추가

---

## 단계 이력

| 단계 | 상태 | 완료일 |
|---|---|---|
| 설계 문서 (ARCHITECTURE.md) | 완료 | 2026-07-21 |
| 1단계 — 스캐폴딩 | 완료 | 2026-07-21 |
| 2단계 — 인증·가정 | 예정 | - |
