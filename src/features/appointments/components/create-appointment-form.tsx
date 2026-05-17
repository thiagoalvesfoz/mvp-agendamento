"use client";

/**
 * CreateAppointmentForm — formulário de tela cheia para criar agendamento.
 *
 * Estrutura segue o protótipo (stepper numerado em 4 seções:
 * Serviço · Cliente · Quando · Detalhes), mas renderiza ocupando a tela
 * inteira (rota /admin/agenda/novo) em vez de bottom-sheet.
 *
 * Slots reais: chama `getSlotsAction` quando serviço+data mudam.
 * Busca de cliente: debounced (200ms), só após 2 chars.
 * Service picker continua como sub-sheet sobreposto.
 */
import { I } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCreateAppointment } from "@/features/appointments/actions";
import { getSlotsAction } from "@/features/booking/client-actions";
import {
  CalendarPicker,
  type BlockedDateEntry,
} from "@/features/booking/components/calendar-picker";
import { TimeGrid } from "@/features/booking/components/time-grid";
import { searchCustomersAction } from "@/features/customers/client-actions";
import type { CustomerSuggestion } from "@/features/customers/queries";
import type { ServiceRow } from "@/features/services/queries";
import { maskPhoneBR } from "@/lib/phone";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

interface CreateAppointmentFormProps {
  services: ServiceRow[];
  initialDate?: string;
  blockedDates?: BlockedDateEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addMinutesToHHmm(hhmm: string, minutes: number): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function fmtDateBR(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function displayPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  return maskPhoneBR(local);
}

// ─── Componente principal ───────────────────────────────────────────────────

export function CreateAppointmentForm({
  services,
  initialDate = "",
  blockedDates = [],
}: CreateAppointmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);

  const [serviceId, setServiceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerInstagram, setCustomerInstagram] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [date, setDate] = useState<Date | null>(isoToDate(initialDate));
  const [time, setTime] = useState<string>("");
  const [briefing, setBriefing] = useState("");

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [nameFocused, setNameFocused] = useState(false);
  const linkedSuggestion = useMemo(
    () => suggestions.find((s) => s.id === linkedCustomerId) ?? null,
    [suggestions, linkedCustomerId],
  );

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const clientReady = customerName.trim().length > 0 && customerPhone.trim().length >= 8;
  const canCreate = !!service && !!date && !!time && clientReady;
  const endTimePreview = service && time ? addMinutesToHHmm(time, service.durationMinutes) : null;

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    getSlotsAction(serviceId, dateToISO(date))
      .then((res) => {
        if (!cancelled) {
          setSlots(res);
          setTime((prev) => (prev && res.includes(prev) ? prev : ""));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  useEffect(() => {
    if (linkedCustomerId) {
      setSuggestions([]);
      return;
    }
    const q = customerName.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const tid = window.setTimeout(async () => {
      const res = await searchCustomersAction(q);
      if (!cancelled) setSuggestions(res);
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [customerName, linkedCustomerId]);

  const handleSelectSuggestion = (c: CustomerSuggestion) => {
    setCustomerName(c.name);
    setCustomerPhone(displayPhone(c.phone));
    setCustomerEmail(c.email ?? "");
    setCustomerInstagram(c.socialMedia ?? "");
    setLinkedCustomerId(c.id);
    setSuggestions((prev) => (prev.find((s) => s.id === c.id) ? prev : [...prev, c]));
    setNameFocused(false);
  };

  const handleNameChange = (value: string) => {
    setCustomerName(value);
    if (linkedCustomerId) setLinkedCustomerId(null);
  };

  const handleUnlink = () => {
    setLinkedCustomerId(null);
  };

  const handleSubmit = () => {
    setError(null);
    if (!service) {
      setError("Selecione um serviço.");
      return;
    }
    if (!date) {
      setError("Informe a data do agendamento.");
      return;
    }
    if (!time) {
      setError("Informe o horário de início.");
      return;
    }

    startTransition(async () => {
      const result = await adminCreateAppointment({
        serviceId: service.id,
        customerId: linkedCustomerId ?? undefined,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        customerInstagram: customerInstagram || undefined,
        date: dateToISO(date),
        startTime: time,
        briefing: briefing || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.data?.id) {
        router.push(`/admin/agenda/${result.data.id}`);
      } else {
        router.push("/admin");
      }
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 pb-3 pt-3">
        <Link
          href="/admin"
          className="press -ml-2 flex size-10 items-center justify-center rounded-full"
          aria-label="Voltar"
        >
          <I.ChevronLeft size={22} />
        </Link>
        <h1 className="text-[15px] font-semibold tracking-tight">Novo agendamento</h1>
        <div className="size-10" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Step 1 — Serviço */}
        <SectionLabel n="1" label="Serviço" done={!!service} />
        <button
          type="button"
          onClick={() => setShowServicePicker(true)}
          className={cn(
            "press mt-2 flex h-11 w-full items-center gap-3 rounded-[10px] border bg-[var(--background)] px-3 text-left transition-colors",
            service ? "border-[var(--border)]" : "border-[var(--input)]",
          )}
        >
          {service ? (
            <>
              <div className="bg-[var(--primary)]/10 flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[var(--primary)]">
                <I.Camera size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium tracking-tight">
                  {service.name}
                </div>
                <div className="text-[11.5px] text-[var(--muted-foreground)]">
                  {formatDuration(service.durationMinutes)} · buffer +{service.bufferPosMinutes}
                </div>
              </div>
            </>
          ) : (
            <span className="flex-1 text-[14px] text-[var(--muted-foreground)]">
              Selecionar serviço…
            </span>
          )}
          <I.ChevronDown size={16} className="shrink-0 text-[var(--muted-foreground)]" />
        </button>

        {/* Step 2 — Quando */}
        <div className={cn("mt-7", !service && "pointer-events-none opacity-50")}>
          <SectionLabel n="2" label="Quando" done={!!date && !!time} disabled={!service} />
          {!service ? (
            <p className="mt-2 text-[12.5px] text-[var(--muted-foreground)]">
              Escolha um serviço primeiro.
            </p>
          ) : (
            <>
              <div className="mt-2">
                <CalendarPicker
                  value={date}
                  onChange={(d) => {
                    setDate(d);
                    setTime("");
                  }}
                  blockedDates={blockedDates}
                />
              </div>
              {date && (
                <div className="mt-4">
                  <Label>Horário</Label>
                  {loadingSlots ? (
                    <div className="bg-[var(--muted)]/30 rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-[13px] text-[var(--muted-foreground)]">
                      Buscando horários…
                    </div>
                  ) : (
                    <TimeGrid
                      slots={slots}
                      value={time || null}
                      onChange={setTime}
                      emptyMessage="Nenhum horário disponível neste dia"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 3 — Cliente */}
        <div className="mt-7">
          <SectionLabel n="3" label="Cliente" done={clientReady} />

          {linkedCustomerId && linkedSuggestion && (
            <div className="bg-[var(--primary)]/10 border-[var(--primary)]/20 mt-2 flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5">
              <I.Check size={13} className="shrink-0 text-[var(--primary)]" />
              <span className="min-w-0 flex-1 truncate text-[11.5px] text-[var(--primary)]">
                Vinculado a cliente existente · {linkedSuggestion.appointmentsCount} agendamento
                {linkedSuggestion.appointmentsCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={handleUnlink}
                className="press text-[11px] text-[var(--primary)] underline underline-offset-2"
              >
                desvincular
              </button>
            </div>
          )}

          <div className="mt-3 space-y-3">
            <div className="relative">
              <Label htmlFor="apt-name">Nome</Label>
              <Input
                id="apt-name"
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => window.setTimeout(() => setNameFocused(false), 150)}
                placeholder="Nome completo"
                maxLength={120}
                autoComplete="off"
              />

              {nameFocused && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--background)] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Clientes encontrados
                  </div>
                  {suggestions.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(c);
                      }}
                      className={cn(
                        "press flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--muted)]",
                        i < suggestions.length - 1 && "border-b border-[var(--border)]",
                      )}
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[11px] font-semibold text-[var(--foreground)]">
                        {c.name
                          .split(" ")
                          .map((w) => w[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium tracking-tight">
                          {c.name}
                        </div>
                        <div className="truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                          {displayPhone(c.phone)}
                        </div>
                      </div>
                      <span className="shrink-0 text-[10.5px] text-[var(--muted-foreground)]">
                        {c.appointmentsCount} ag.
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="apt-phone" hint="WhatsApp">
                  Telefone
                </Label>
                <Input
                  id="apt-phone"
                  type="tel"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(maskPhoneBR(e.target.value))}
                  placeholder="(11) 9..."
                  maxLength={15}
                />
              </div>
              <div>
                <Label htmlFor="apt-instagram" hint="opcional">
                  Instagram
                </Label>
                <Input
                  id="apt-instagram"
                  value={customerInstagram}
                  onChange={(e) => setCustomerInstagram(e.target.value)}
                  placeholder="@perfil"
                  maxLength={120}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="apt-email" hint="opcional">
                E-mail
              </Label>
              <Input
                id="apt-email"
                type="email"
                inputMode="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@dominio.com"
                maxLength={200}
              />
            </div>
          </div>
        </div>

        {/* Step 4 — Briefing */}
        <div className="mt-7">
          <SectionLabel n="4" label="Briefing" done={briefing.trim().length > 0} />
          <div className="mt-3">
            <textarea
              id="apt-briefing"
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="Notas internas ou pedido do cliente (opcional)."
              maxLength={2000}
              rows={3}
              className={cn(
                "w-full rounded-[8px] border border-[var(--input)] bg-[var(--background)]",
                "px-3 py-2 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
                "focus:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[oklch(0.708_0_0_/_0.5)]",
                "resize-none",
              )}
            />
          </div>
        </div>

        {/* Detalhes — info card sem título */}
        <div className="mt-7 flex items-start gap-2 rounded-[10px] bg-[var(--muted)] px-3 py-2.5">
          <I.Info size={14} className="mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
          <p className="text-[12px] leading-snug text-[var(--muted-foreground)]">
            Agendamentos criados por você entram diretamente como{" "}
            <strong className="font-semibold text-[var(--foreground)]">Confirmado</strong>, sem
            necessidade de aprovação.
          </p>
        </div>

        {error && <p className="mt-4 text-[13px] text-[var(--destructive)]">{error}</p>}
      </div>

      {/* Footer sticky */}
      <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-3.5">
        {canCreate && service && date && endTimePreview && (
          <div className="mb-2.5 flex items-center justify-between text-[12px]">
            <div className="min-w-0 flex-1 truncate pr-2 text-[var(--muted-foreground)]">
              <span className="font-medium text-[var(--foreground)]">{service.name}</span>
              {" · "}
              <span className="font-mono">
                {fmtDateBR(date)} · {time}
              </span>
            </div>
            <div className="shrink-0 font-mono text-[var(--muted-foreground)]">
              → {endTimePreview}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/admin")}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isPending || !canCreate || services.length === 0}
          >
            {isPending ? "Criando..." : "Criar agendamento"}
          </Button>
        </div>
      </div>

      {/* Service picker — sub-sheet */}
      {showServicePicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowServicePicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[78%] max-w-[440px] flex-col rounded-t-[20px] bg-[var(--background)]"
          >
            <div className="flex justify-center pb-1 pt-2.5">
              <div className="h-1 w-9 rounded-full bg-[var(--border)]" />
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 pb-3 pt-2">
              <h3 className="text-[16px] font-semibold tracking-tight">Selecionar serviço</h3>
              <button
                type="button"
                onClick={() => setShowServicePicker(false)}
                className="press flex size-8 items-center justify-center rounded-full bg-[var(--muted)]"
                aria-label="Fechar seleção"
              >
                <I.Close size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {services.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[var(--destructive)]">
                  Nenhum serviço ativo. Crie um serviço antes de agendar.
                </p>
              ) : (
                <ul className="space-y-1">
                  {services.map((s) => {
                    const selected = s.id === serviceId;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setServiceId(s.id);
                            setTime("");
                            setShowServicePicker(false);
                          }}
                          className={cn(
                            "press flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors",
                            selected ? "bg-[var(--primary)]/10" : "hover:bg-[var(--muted)]",
                          )}
                        >
                          <div className="bg-[var(--primary)]/10 flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--primary)]">
                            <I.Camera size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[14px] font-medium tracking-tight">
                              {s.name}
                            </div>
                            <div className="text-[11.5px] text-[var(--muted-foreground)]">
                              {formatDuration(s.durationMinutes)} · buffer +{s.bufferPosMinutes}
                            </div>
                          </div>
                          {selected && (
                            <I.Check size={16} className="shrink-0 text-[var(--primary)]" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

interface SectionLabelProps {
  n: string;
  label: string;
  done?: boolean;
  disabled?: boolean;
}

function SectionLabel({ n, label, done, disabled }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-full text-[10.5px] font-semibold tabular-nums",
          done
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : disabled
              ? "bg-[var(--muted)] text-[var(--muted-foreground)]"
              : "bg-[var(--muted)] text-[var(--foreground)]",
        )}
      >
        {done ? <I.Check size={11} strokeWidth={2.5} /> : n}
      </span>
      <span className="text-[13px] font-semibold tracking-tight">{label}</span>
    </div>
  );
}
