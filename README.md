# 가족 가계부 (gagyebu-app)

가족 공동 가계부·미래소득 대응·자산관리 플랫폼. 현재 **1단계(스캐폴딩)** 상태입니다.

## 1단계에서 된 것 / 안 된 것

**된 것**: 폴더 구조, 반응형 셸(모바일 하단탭 / PC 사이드바), SF 다크테마 디자인시스템,
전체 데이터 타입(`src/lib/types`), 규칙기반 계산엔진(`src/lib/finance-engine`, mock 데이터로 실제 계산 동작),
주요 화면 UI(로그인/회원가입/가정생성/대시보드/거래목록 등, mock 데이터 기반).

**안 된 것**: 실제 로그인·DB(Supabase), SMS 실발송, AI 호출, 이미지·PDF 분석, PDF 출력.
이 항목들은 `ARCHITECTURE.md`의 단계별 개발순서에 따라 2단계부터 순차 연결합니다.

## 시작하기

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속. 로그인/가입 없이 대시보드가 바로 보이는 것은 1단계 임시 상태입니다(2단계에서 인증 게이트 연결).

## 스크립트

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run typecheck` — 타입 검사
- `npm run test` — finance-engine 단위테스트 (vitest)
- `npm run lint` — ESLint

## 환경변수

`.env.example`을 복사해 `.env.local`로 만들고 값을 채웁니다. 2단계부터 필요합니다. `.env.local`은 절대 커밋하지 않습니다.

## 문서

- `ARCHITECTURE.md` — 전체 시스템 설계(15개 항목: 구조/DB/권한/인증/SMS/규칙기반/AI/이미지PDF분석/패키지/운영비용/보안위험/MVP범위/추후기능/개발순서)
- `PROGRESS.md` — 단계별 진행상황 기록 (다음 세션 시작 시 먼저 확인)

## 참고

이 프로젝트는 이 폴더에서 계속 개발합니다. 개발 도중 세션이 끊겨도 `PROGRESS.md`를 보면 어디까지 됐는지 알 수 있습니다.
