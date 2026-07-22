"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarNavGroups } from "./nav-config";
import { cn } from "@/lib/utils";

/** PC 전용 좌측 사이드바 — 관련 메뉴 그룹화 (요구사항 63) */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-bg-elevated p-4 md:block print:hidden">
      <div className="mb-6 px-2 text-lg font-semibold text-text-primary">가족 가계부</div>
      <nav className="space-y-6">
        {sidebarNavGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-neon-blue/15 text-neon-blue"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      )}
                    >
                      <Icon size={17} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
