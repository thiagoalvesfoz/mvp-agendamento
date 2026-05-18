"use client";

import { I } from "@/components/shared/icons";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/features/appointments/components/agenda-shared";
import { daysDiff } from "@/features/appointments/date-helpers";
import type { AppointmentCard } from "@/features/appointments/types";
import { formatDateBR, monthShort, weekdayShort } from "@/lib/time";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

interface PendingViewProps {
  appointments: AppointmentCard[];
  todayISO: string;
}

export function PendingView({ appointments, todayISO }: PendingViewProps) {
  const buckets = useMemo(() => {
    const groups = {
      overdue: [] as AppointmentCard[],
      today: [] as AppointmentCard[],
      thisWeek: [] as AppointmentCard[],
      later: [] as AppointmentCard[],
    };
    for (const a of appointments) {
      const diff = daysDiff(a.date, todayISO);
      if (diff < 0) groups.overdue.push(a);
      else if (diff === 0) groups.today.push(a);
      else if (diff < 7) groups.thisWeek.push(a);
      else groups.later.push(a);
    }
    return groups;
  }, [appointments, todayISO]);

  const sections = [
    {
      key: "overdue" as const,
      label: "Vencidos",
      tone: "danger" as const,
    },
    { key: "today" as const, label: "Hoje" },
    { key: "thisWeek" as const, label: "Esta semana" },
    { key: "later" as const, label: "Mais à frente" },
  ].filter((s) => buckets[s.key].length > 0);

  if (appointments.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        <EmptyState
          icon={<I.Check size={22} />}
          title="Nenhum pedido pendente"
          desc="Tudo respondido. Bom trabalho."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-24">
      <p className="mb-3 text-[12.5px] text-[var(--muted-foreground)]">
        <span className="font-mono font-medium text-[var(--foreground)]">
          {appointments.length}
        </span>{" "}
        pedido{appointments.length > 1 ? "s" : ""} aguardando sua resposta.
      </p>

      <div className="space-y-5">
        {sections.map((s) => (
          <div key={s.key}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3
                className={cn(
                  "text-[12px] font-medium uppercase tracking-[0.14em]",
                  s.tone === "danger"
                    ? "text-[var(--destructive)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                {s.label}
              </h3>
              <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                {buckets[s.key].length}
              </span>
            </div>
            <div className="space-y-2">
              {buckets[s.key].map((a) => (
                <PendingCard key={a.id} appt={a} todayISO={todayISO} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingCard({ appt, todayISO }: { appt: AppointmentCard; todayISO: string }) {
  const date = new Date(appt.date);
  // appt.date é @db.Date → leia via UTC getters para preservar o dia exato.
  const apptY = date.getUTCFullYear();
  const apptM = date.getUTCMonth();
  const apptD = date.getUTCDate();
  const diff = daysDiff(appt.date, todayISO);
  // Reconstrói como meio-dia local para extrair dia da semana / formato BR sem TZ shift
  const displayDate = new Date(apptY, apptM, apptD, 12, 0, 0);
  const dateLabel =
    diff === 0
      ? "Hoje"
      : diff === 1
        ? "Amanhã"
        : diff < 0
          ? `Há ${-diff}d`
          : diff < 7
            ? `${weekdayShort(displayDate.getDay())}, ${apptD} ${monthShort(apptM)}`
            : formatDateBR(displayDate);

  return (
    <Link href={`/admin/agenda/${appt.id}`} className="press block">
      <Card className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-tight">
            {appt.customerNameSnapshot}
          </span>
          <StatusBadge status={appt.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">{dateLabel}</span>
          <span>·</span>
          <span className="font-mono">{appt.startTime}</span>
          <span>·</span>
          <span className="truncate">{appt.serviceNameSnapshot}</span>
        </div>
        <div className="text-[var(--muted-foreground)]/70 mt-1 font-mono text-[10.5px]">
          {appt.protocol}
        </div>
      </Card>
    </Link>
  );
}
