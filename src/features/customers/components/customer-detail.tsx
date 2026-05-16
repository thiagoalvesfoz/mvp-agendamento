/**
 * CustomerDetail — composição da tela de detalhe do cliente.
 *
 * Server Component. Recebe dados já buscados pela page.tsx.
 * Partes interativas (AnonymizeButton) são importadas como Client Components
 * folha, mantendo o restante no servidor.
 */
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { I } from "@/components/shared/icons";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";
import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import { AnonymizeButton } from "@/features/customers/components/anonymize-button";
import { formatInTZ } from "@/lib/time";
import type { CustomerDetail as CustomerDetailData } from "@/features/customers/queries";

/** Formata telefone local BR a partir do número normalizado (com DDI 55). */
function fmtPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return raw;
}

/**
 * Monta a URL do WhatsApp — telefone já vem normalizado com DDI 55,
 * mas wa.me aceita somente dígitos sem +.
 */
function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

interface ContactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}

function ContactRow({ icon, label, value, href }: ContactRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--muted-foreground)]">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-[var(--muted-foreground)]">{label}</div>
        <div className="text-[13.5px] font-medium tracking-tight truncate">{value}</div>
      </div>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="press text-[12px] font-medium text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg px-2.5 py-1 shrink-0"
        >
          Abrir
        </a>
      )}
    </div>
  );
}

interface CustomerDetailProps {
  customer: CustomerDetailData;
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const appointmentCount = customer.appointments.length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header com back button ── */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-2">
        <Link
          href="/admin/clientes"
          className="press size-8 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] -ml-1"
          aria-label="Voltar para clientes"
        >
          <I.ChevronLeft size={20} />
        </Link>
        <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
          Cliente
        </p>
      </div>

      {/* ── Conteúdo scrollável ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Avatar + nome + cliente desde */}
        <div className="flex items-center gap-3.5 mt-1">
          <CustomerAvatar name={customer.name} size="lg" />
          <div>
            <h1 className="text-[20px] font-semibold leading-tight tracking-tight">
              {customer.name}
            </h1>
            <div className="text-[12px] text-[var(--muted-foreground)] mt-0.5">
              Cliente desde {formatInTZ(customer.createdAt, "dd/MM/yyyy")}
            </div>
          </div>
        </div>

        {/* ── Card Contato ── */}
        <Card className="mt-5 p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Contato
          </div>
          <div className="mt-3 space-y-3">
            <ContactRow
              icon={<I.MessageCircle size={15} />}
              label="WhatsApp"
              value={fmtPhone(customer.phone)}
              href={waLink(customer.phone)}
            />
            {customer.email && (
              <ContactRow
                icon={<I.Mail size={15} />}
                label="Email"
                value={customer.email}
              />
            )}
            {customer.socialMedia && (
              <ContactRow
                icon={<I.Instagram size={15} />}
                label="Instagram"
                value={customer.socialMedia}
              />
            )}
          </div>
        </Card>

        {/* ── Histórico de agendamentos ── */}
        <div className="mt-5 mb-3 flex items-baseline justify-between">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Histórico
          </div>
          <span className="text-[12px] text-[var(--muted-foreground)]">
            {appointmentCount} {appointmentCount === 1 ? "agendamento" : "agendamentos"}
          </span>
        </div>

        {appointmentCount === 0 ? (
          <p className="text-[13px] text-[var(--muted-foreground)] text-center py-6">
            Nenhum agendamento registrado.
          </p>
        ) : (
          <div className="space-y-2">
            {customer.appointments.map((appt) => (
              <Link
                key={appt.id}
                href={`/admin/agenda/${appt.id}`}
                className="press flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 transition-colors hover:bg-[var(--muted)]"
              >
                <StatusDot status={appt.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium tracking-tight truncate">
                    {appt.serviceNameSnapshot}
                  </div>
                  <div className="text-[11.5px] text-[var(--muted-foreground)]">
                    {/* @db.Date vem como 00:00 UTC → formatInTZ(SP) recuaria 1d.
                        Lê via getters UTC pra preservar a data armazenada. */}
                    {`${String(appt.date.getUTCDate()).padStart(2, "0")}/${String(appt.date.getUTCMonth() + 1).padStart(2, "0")}/${appt.date.getUTCFullYear()}`}{" "}
                    · {appt.startTime}
                  </div>
                </div>
                <StatusBadge status={appt.status} />
                <I.Chevron size={14} className="text-[var(--muted-foreground)] shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* ── Seção LGPD ── */}
        <div className="mt-7 pt-5 border-t border-[var(--border)]">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-2">
            LGPD
          </div>
          <Card className="p-4 bg-[var(--muted)]/40">
            <div className="flex gap-2.5">
              <I.Shield size={15} className="text-[var(--muted-foreground)] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[var(--muted-foreground)] leading-snug flex-1">
                Conforme exige a LGPD, o cliente pode solicitar a exclusão dos seus dados. Você
                consegue executar a exclusão imediatamente aqui.
              </p>
            </div>
            {/* Client Component — isola o estado do sheet sem contaminar o Server Component */}
            <AnonymizeButton customerId={customer.id} customerName={customer.name} />
          </Card>
        </div>
      </div>
    </div>
  );
}
