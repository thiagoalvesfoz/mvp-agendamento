"use client";

import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { Sheet } from "./sheet";

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
    <Sheet open={open} onClose={() => !isPending && onCancel()} className="rounded-t-[28px]">
      <Sheet.Header title={title} description={description} />
      <Sheet.Footer>
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
      </Sheet.Footer>
    </Sheet>
  );
}
