"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 비밀번호 표시·숨김 입력란 (요구사항 7)
 * 기본 숨김 상태, 화면 전환 시 컴포넌트가 언마운트되며 자연히 숨김으로 초기화된다.
 */
export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(
            "touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 pr-11 text-sm text-text-primary outline-none focus:border-neon-blue",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-muted hover:text-text-primary"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);
