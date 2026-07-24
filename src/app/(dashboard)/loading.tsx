/**
 * 대시보드 라우트 전환 시 즉시 보여줄 스켈레톤 (Next.js App Router의 자동 Suspense 경계).
 * 이게 없으면 서버 컴포넌트의 데이터 조회가 전부 끝날 때까지 화면이 그대로 멈춰 있어서
 * "눌러도 반응이 없다"고 느끼고 다시 클릭하게 된다 — 클릭 즉시 이 스켈레톤이 먼저 그려진다.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="h-6 w-32 animate-pulse rounded bg-bg-elevated" />
      <div className="space-y-3 rounded-2xl border border-border bg-bg-surface p-4">
        <div className="h-4 w-full animate-pulse rounded bg-bg-elevated" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-bg-elevated" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-bg-elevated" />
      </div>
      <div className="h-40 w-full animate-pulse rounded-2xl border border-border bg-bg-surface" />
      <div className="h-40 w-full animate-pulse rounded-2xl border border-border bg-bg-surface" />
    </div>
  );
}
