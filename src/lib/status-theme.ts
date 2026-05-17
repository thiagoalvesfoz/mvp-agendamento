import type { AppointmentStatus } from "@prisma/client";

export interface StatusThemeEntry {
  label: string;
  hint: string;
  badgeClass: string;
  dotClass: string;
}

export const STATUS_THEME = {
  PENDING: {
    label: "Pendente",
    hint: "Aguardando confirmação",
    badgeClass: "bg-[oklch(0.97_0.04_85)] text-[oklch(0.40_0.10_75)] border-transparent",
    dotClass: "bg-[oklch(0.72_0.15_75)]",
  },
  CONFIRMED: {
    label: "Confirmado",
    hint: "Agendado e ocupando o slot",
    badgeClass: "bg-[oklch(0.96_0.04_150)] text-[oklch(0.38_0.10_150)] border-transparent",
    dotClass: "bg-[oklch(0.60_0.15_150)]",
  },
  COMPLETED: {
    label: "Concluído",
    hint: "Atendimento finalizado",
    badgeClass: "bg-primary/10 text-primary border-transparent",
    dotClass: "bg-primary",
  },
  NO_SHOW: {
    label: "Não compareceu",
    hint: "Cliente faltou",
    badgeClass: "bg-destructive/10 text-destructive border-transparent",
    dotClass: "bg-destructive",
  },
  CANCELED: {
    label: "Cancelado",
    hint: "Slot liberado",
    badgeClass: "bg-muted text-muted-foreground border-transparent",
    dotClass: "bg-muted-foreground",
  },
  EXPIRED: {
    label: "Expirado",
    hint: "Pedido expirou sem confirmação",
    badgeClass: "bg-muted text-muted-foreground border-transparent",
    dotClass: "bg-muted-foreground",
  },
} satisfies Record<AppointmentStatus, StatusThemeEntry>;
