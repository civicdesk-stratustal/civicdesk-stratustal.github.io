import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-2xl p-4", className)} {...rest}>
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "glass" | "ghost" | "danger";
  loading?: boolean;
};

export function GlassButton({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-primary text-primary-foreground shadow-lg shadow-primary/30 border border-white/10",
    glass: "glass text-foreground",
    ghost: "text-foreground/70 border border-transparent",
    danger: "bg-destructive/90 text-destructive-foreground border border-white/10",
  };
  return (
    <button
      className={cn(
        "press inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold disabled:opacity-50",
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      {children}
    </button>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export function GlassInput({ label, error, className, ...rest }: InputProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-foreground/60">
          {label}
        </span>
      ) : null}
      <input
        className={cn(
          "min-h-11 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-sm text-foreground placeholder:text-foreground/35 outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/30",
          error && "border-destructive/70",
          className,
        )}
        {...rest}
      />
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

export function Orbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-600/25 via-purple-600/15 to-transparent blur-3xl" />
      <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-600/20 via-blue-500/10 to-transparent blur-3xl" />
      <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-3xl" />
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-[100dvh] w-full max-w-md overflow-x-hidden bg-slate-950 shadow-2xl">
      <Orbs />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
