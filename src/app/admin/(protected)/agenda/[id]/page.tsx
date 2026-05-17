/**
 * /admin/agenda/[id] — Detalhe de um agendamento.
 *
 * Server Component. Exibe snapshots (RN15) do serviço e cliente no momento
 * do agendamento, contato com link direto pro WhatsApp, briefing e histórico
 * completo. Ações de transição de status são delegadas ao Client Component
 * `AppointmentActions`.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { I } from "@/components/shared/icons";
import { formatDuration, formatInTZ, weekdayName } from "@/lib/time";
import { getAppointmentById } from "@/features/appointments/queries";
import { AppointmentActions } from "@/features/appointments/components/appointment-actions";
import { DurationAdjuster } from "@/features/appointments/components/duration-adjuster";
import { StatusSection } from "@/features/appointments/components/status-section";

interface AppointmentDetailPageProps {
  params: Promise<{ id: string }>;
}

const HISTORY_LABELS: Record<string, string> = {
  status_change: "Status alterado",
  duration_change: "Duração ajustada",
  consent: "Consentimento registrado",
  created: "Pedido criado",
};

const STATUS_LABELS_PT: Record<string, string> = {
  PENDING: "pendente",
  CONFIRMED: "confirmado",
  COMPLETED: "concluído",
  NO_SHOW: "não compareceu",
  CANCELED: "cancelado",
  EXPIRED: "expirado",
};

/** Monta link wa.me?text=... a partir de telefone normalizado (já com DDI 55). */
function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

/** Formata telefone do snapshot (5511999999999 → +55 11 99999-9999). */
function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("55")) {
    return `+55 ${d.slice(2, 4)} ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 12 && d.startsWith("55")) {
    return `+55 ${d.slice(2, 4)} ${d.slice(4, 8)}-${d.slice(8)}`;
  }
  return phone;
}

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const { id } = await params;
  const appt = await getAppointmentById(id);

  if (!appt) notFound();

  // appt.date é @db.Date → vem como 00:00 UTC. Lê via UTC getters para
  // preservar o dia exato (formatInTZ deslocaria pra dia anterior em SP).
  const date = appt.date;
  const MES_LONG = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const dateLong = `${weekdayName(date.getUTCDay())}, ${date.getUTCDate()} de ${MES_LONG[date.getUTCMonth()]}`;
  const isFinal =
    appt.status === "COMPLETED" ||
    appt.status === "CANCELED" ||
    appt.status === "EXPIRED" ||
    appt.status === "NO_SHOW";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 pt-3">
        <Link
          href="/admin"
          className="press -ml-2 flex size-10 items-center justify-center rounded-full"
          aria-label="Voltar"
        >
          <I.ChevronLeft size={22} />
        </Link>
        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          Agendamento
        </div>
        <div className="size-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Hero */}
        <div className="pt-1">
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">
            {appt.customerNameSnapshot}
          </h1>
          <div className="mt-2">
            <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
              {appt.protocol}
            </span>
          </div>
        </div>

        {/* Status — destaque + override */}
        <StatusSection appointmentId={appt.id} status={appt.status} />

        {/* Serviço + quando */}
        <Card className="mt-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
              <I.Camera size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-medium tracking-tight">
                {appt.serviceNameSnapshot}
              </div>
              <div className="text-[12px] text-[var(--muted-foreground)]">
                {formatDuration(appt.durationMinutesSnapshot)}
                {appt.bufferPreSnapshot > 0 && ` · buffer pré ${appt.bufferPreSnapshot}min`}
                {appt.bufferPosSnapshot > 0 && ` · pós ${appt.bufferPosSnapshot}min`}
              </div>
            </div>
          </div>
          <div className="my-3.5 h-px bg-[var(--border)]" />
          <div className="space-y-2.5 text-[13.5px]">
            <div className="flex items-center gap-2.5">
              <I.Calendar size={15} className="text-[var(--muted-foreground)]" />
              <span className="w-16 text-[var(--muted-foreground)]">Data</span>
              <span className="capitalize">{dateLong}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <I.Clock size={15} className="text-[var(--muted-foreground)]" />
              <span className="w-16 text-[var(--muted-foreground)]">Horário</span>
              <span className="font-mono">
                {appt.startTime} – {appt.endTime}
              </span>
            </div>
          </div>

          {appt.status === "PENDING" || appt.status === "CONFIRMED" ? (
            <DurationAdjuster
              appointmentId={appt.id}
              startTime={appt.startTime}
              endTime={appt.endTime}
              durationSnapshot={appt.durationMinutesSnapshot}
            />
          ) : (
            appt.actualDurationMinutes &&
            appt.actualDurationMinutes !== appt.durationMinutesSnapshot && (
              <div className="mt-4 flex items-center gap-2.5 border-t border-[var(--border)] pt-3.5 text-[13.5px]">
                <I.Edit size={15} className="text-[var(--muted-foreground)]" />
                <span className="w-16 text-[var(--muted-foreground)]">Real</span>
                <span>{formatDuration(appt.actualDurationMinutes)}</span>
              </div>
            )
          )}
        </Card>

        {/* Contato */}
        <Card className="mt-3 p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Contato
          </div>
          <div className="mt-3 space-y-2.5">
            <ContactRow
              icon={<I.MessageCircle size={15} />}
              label="WhatsApp"
              value={formatPhone(appt.customerContactSnapshot)}
              href={whatsappLink(appt.customerContactSnapshot)}
              actionLabel="Abrir conversa"
            />
            {appt.customerEmailSnapshot && (
              <ContactRow
                icon={<I.Mail size={15} />}
                label="Email"
                value={appt.customerEmailSnapshot}
                href={`mailto:${appt.customerEmailSnapshot}`}
              />
            )}
            {appt.customerSocialMediaSnapshot && (
              <ContactRow
                icon={<I.Instagram size={15} />}
                label="Social"
                value={appt.customerSocialMediaSnapshot}
              />
            )}
          </div>
          <div className="my-3 h-px bg-[var(--border)]" />
          <Link
            href={`/admin/clientes/${appt.customerId}`}
            className="press inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary)]"
          >
            Ver perfil do cliente <I.ArrowRight size={12} />
          </Link>
        </Card>

        {/* Briefing */}
        {appt.briefing && (
          <Card className="mt-3 p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Briefing do cliente
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed">{appt.briefing}</p>
          </Card>
        )}

        {/* Histórico */}
        <Card className="mt-3 p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Histórico
          </div>
          <div className="mt-3 space-y-2.5 text-[12.5px]">
            {appt.history.map((h) => {
              const isCreate = h.eventType === "status_change" && h.statusFrom === null;
              const base = HISTORY_LABELS[h.eventType] ?? h.eventType;
              const detail = isCreate
                ? "Pedido criado"
                : h.eventType === "status_change" && h.statusTo
                  ? `${base.toLowerCase()} para ${STATUS_LABELS_PT[h.statusTo] ?? h.statusTo}`
                  : base;
              return (
                <HistoryRow
                  key={h.id}
                  when={formatInTZ(h.createdAt, "dd/MM HH:mm")}
                  label={detail}
                  reason={h.reason ?? undefined}
                />
              );
            })}
          </div>
        </Card>
      </div>

      {/* Ações */}
      <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-3.5">
        {isFinal ? (
          <Link
            href="/admin"
            className="press flex h-11 items-center justify-center rounded-[26px] border border-[var(--border)] bg-[var(--background)] text-[14px] font-medium"
          >
            Voltar para a agenda
          </Link>
        ) : (
          <AppointmentActions appointmentId={appt.id} status={appt.status} />
        )}
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  actionLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[13.5px]">
      <span className="text-[var(--muted-foreground)]">{icon}</span>
      <span className="w-[72px] text-[var(--muted-foreground)]">{label}</span>
      <span className="flex-1 truncate">{value}</span>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="press inline-flex items-center gap-0.5 text-[12px] font-medium text-[var(--primary)]"
        >
          {actionLabel ?? "Abrir"} <I.ArrowRight size={12} />
        </a>
      )}
    </div>
  );
}

function HistoryRow({ when, label, reason }: { when: string; label: string; reason?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-[70px] shrink-0 pt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">
        {when}
      </span>
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--border)]" />
      <div className="min-w-0 flex-1">
        <span className="capitalize text-[var(--foreground)]">{label}</span>
        {reason && <p className="mt-0.5 text-[11.5px] text-[var(--muted-foreground)]">{reason}</p>}
      </div>
    </div>
  );
}
