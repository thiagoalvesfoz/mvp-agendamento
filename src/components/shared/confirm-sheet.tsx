"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "./bottom-sheet";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancelar",
  variant = "default",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={() => !isPending && onCancel()}
      className="rounded-t-[28px] bg-[var(--background)] p-5"
    >
      <div aria-labelledby="confirm-sheet-title">
        <div className="flex justify-center pb-3 pt-1">
          <div className="h-1 w-9 rounded-full bg-[var(--border)]" />
        </div>

        <h3 id="confirm-sheet-title" className="text-[17px] font-semibold tracking-tight">
          {title}
        </h3>
        <div className="mt-2 text-[13px] leading-snug text-[var(--muted-foreground)]">
          {description}
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            className="flex-1"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && pendingLabel ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
