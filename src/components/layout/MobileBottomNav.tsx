"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems } from "./nav-config";
import { cn } from "@/lib/utils";

/** 모바일 전용 하단 탭바 — 한 손 조작, 큰 터치영역 (요구사항 5) */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-elevated/95 backdrop-blur md:hidden print:hidden">
      <ul className="grid grid-cols-5">
        {mobileNavItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "touch-target flex flex-col items-center justify-center gap-1 py-2 text-xs",
                  active ? "text-neon-blue" : "text-text-muted"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
