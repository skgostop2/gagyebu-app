import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-neon-blue text-white hover:brightness-110",
  secondary: "bg-surface border border-border text-text-primary hover:bg-surface-hover",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary",
  danger: "bg-status-danger text-white hover:brightness-110",
};

export function Button({
  variant = "primary",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "touch-target inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-blue",
        variantClass[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
}
