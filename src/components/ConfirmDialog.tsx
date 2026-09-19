import type { ReactNode } from "react";
import { GlassButton } from "@/components/glass";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  icon,
  destructive,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: ReactNode;
  destructive?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 px-6 backdrop-blur-2xl">
      <div className="glass-strong w-full max-w-sm rounded-3xl p-6 text-center">
        {icon ? (
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
            {icon}
          </div>
        ) : null}
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-foreground/60">{message}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <GlassButton variant="glass" onClick={onCancel}>
            {cancelLabel}
          </GlassButton>
          <GlassButton variant={destructive ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
