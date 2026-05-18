"use client";

import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { BottomSheet } from "./bottom-sheet";

function SheetRoot({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      className={cn(
        "flex max-h-[85dvh] flex-col rounded-t-[20px] border-t border-border bg-background",
        className,
      )}
    >
      <div className="flex shrink-0 justify-center pt-2">
        <div className="h-1 w-10 rounded-full bg-border" />
      </div>
      <div className="flex h-full flex-col p-5">{children}</div>
    </BottomSheet>
  );
}

function SheetHeader({
  title,
  description,
  className,
  onClose,
}: {
  title: string;
  description?: ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  return (
    <div className={cn("flex shrink-0 items-center justify-between pb-4", className)}>
      <div>
        <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="press flex size-8 items-center justify-center rounded-full text-muted-foreground"
        >
          <I.Close size={18} />
        </button>
      )}
    </div>
  );
}

function SheetContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto pb-4", className)}>{children}</div>;
}

function SheetFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex shrink-0 gap-2 border-t border-border py-3.5", className)}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.875rem)" }}
    >
      {children}
    </div>
  );
}

export const Sheet = Object.assign(SheetRoot, {
  Header: SheetHeader,
  Content: SheetContent,
  Footer: SheetFooter,
});
