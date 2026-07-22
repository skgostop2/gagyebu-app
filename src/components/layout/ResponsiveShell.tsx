import { MobileBottomNav } from "./MobileBottomNav";
import { SidebarNav } from "./SidebarNav";
import { TopBar } from "./TopBar";

/**
 * 반응형 셸 — 모바일은 하단탭, PC는 좌측 사이드바, 태블릿은 상단바 + 2열 콘텐츠(각 화면에서 처리).
 * 데이터 로직은 각 페이지가 담당하고, 이 컴포넌트는 셸(구조)만 담당한다.
 */
export function ResponsiveShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <SidebarNav />
      <div className="flex min-h-dvh flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
