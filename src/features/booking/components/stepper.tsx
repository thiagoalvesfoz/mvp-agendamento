"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { I } from "@/components/shared/icons";
import { StepperHeader } from "./stepper-header";
import { ServiceRow } from "./service-row";
import { CalendarPicker } from "./calendar-picker";
import { TimeGrid } from "./time-grid";
import { ConfirmationView } from "./confirmation-view";
import { createAppointment } from "../actions";
import { maskPhoneBR } from "@/lib/phone";
import type { ServiceForBooking } from "../queries";
import type { BlockedDateEntry } from "./calendar-picker";
import { getSlotsAction } from "../client-actions";

const TOTAL_STEPS = 4;

interface BookingStepperProps {
  studioName: string;
  services: ServiceForBooking[];
  blockedDates: BlockedDateEntry[];
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtLongDate(iso: string): string {
  return format(parseISO(iso), "EEEE, d 'de' MMMM", { locale: ptBR });
}

function addMinutesToHHmm(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function BookingStepper({ studioName, services, blockedDates }: BookingStepperProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [service, setService] = useState<ServiceForBooking | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
    briefing: "",
    termsAccepted: false,
  });
  const [protocol, setProtocol] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const back = () => {
    if (step === 1) {
      router.push("/");
      return;
    }
    setStep((s) => s - 1);
    setSubmitError(null);
  };

  const handleSelectService = (s: ServiceForBooking) => {
    setService(s);
    setDate(null);
    setStartTime(null);
    setSlots([]);
    setTimeout(() => setStep(2), 180);
  };

  const handleSelectDate = async (d: Date) => {
    const iso = dateToIso(d);
    setDate(iso);
    setStartTime(null);
    if (!service) return;
    setSlotsLoading(true);
    try {
      const result = await getSlotsAction(service.id, iso);
      setSlots(result);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!service || !date || !startTime) return;
    setSubmitError(null);
    startTransition(async () => {
      const result = await createAppointment({
        serviceId: service.id,
        date,
        startTime,
        name: form.name,
        phone: form.phone,
        email: form.email,
        instagram: form.instagram,
        briefing: form.briefing,
        termsAccepted: true,
      });
      if (result.ok) {
        setProtocol(result.protocol);
        setStep(4);
      } else {
        setSubmitError(result.error);
      }
    });
  };

  const canSubmit = form.name.trim() && form.phone.trim() && form.termsAccepted && !isPending;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StepperHeader
        step={step}
        totalSteps={TOTAL_STEPS}
        studioName={studioName}
        onBack={back}
      />

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {step === 1 && (
          <div className="slide-in">
            <h1 className="text-[26px] font-semibold leading-[1.1] tracking-tight">
              Qual serviço você procura?
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Escolha um para ver os horários disponíveis. Valores são alinhados após a conversa.
            </p>
            <div className="mt-5 space-y-2.5">
              {services.map((s) => (
                <ServiceRow
                  key={s.id}
                  service={s}
                  selected={service?.id === s.id}
                  onSelect={handleSelectService}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && service && (
          <div className="slide-in">
            <div className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
              {service.name} · {service.durationMinutes} min
            </div>
            <h1 className="mt-2 text-[26px] font-semibold leading-[1.1] tracking-tight">
              Escolha data e horário
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Mostrando os horários realmente livres, considerando intervalos entre atendimentos.
            </p>

            <div className="mt-5">
              <Label hint="qualquer mês">Data</Label>
              <CalendarPicker
                value={date ? new Date(`${date}T12:00:00`) : null}
                onChange={handleSelectDate}
                blockedDates={blockedDates}
              />
            </div>

            {date && (
              <div className="mt-6">
                <Label>Horário em {fmtLongDate(date)}</Label>
                {slotsLoading ? (
                  <div className="text-center text-[13px] text-muted-foreground">
                    Carregando horários…
                  </div>
                ) : (
                  <TimeGrid slots={slots} value={startTime} onChange={setStartTime} />
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && service && date && startTime && (
          <div className="slide-in">
            <h1 className="text-[26px] font-semibold leading-[1.1] tracking-tight">
              Conte um pouco sobre você
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Quanto mais detalhes, melhor a preparação para o seu atendimento.
            </p>

            <Card className="mt-5 bg-muted/50 p-3.5">
              <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
                <I.Calendar size={13} /> Resumo
              </div>
              <div className="mt-1.5 text-[15px] font-medium">{service.name}</div>
              <div className="text-[13px] text-muted-foreground">
                {fmtLongDate(date)} · {startTime} –{" "}
                {addMinutesToHHmm(startTime, service.durationMinutes)}
              </div>
            </Card>

            <div className="mt-5 space-y-3.5">
              <div>
                <Label>Nome completo</Label>
                <Input
                  placeholder="Como você prefere ser chamado"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label hint="WhatsApp">Telefone</Label>
                <Input
                  placeholder="(45) 99999-9999"
                  type="tel"
                  inputMode="tel"
                  maxLength={15}
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: maskPhoneBR(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label hint="opcional">Email</Label>
                <Input
                  placeholder="seu@email.com"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label hint="opcional">Instagram</Label>
                <Input
                  placeholder="@seuperfil"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                />
              </div>
              <div>
                <Label hint="o que você gostaria">Briefing</Label>
                <Textarea
                  placeholder="Conte sobre o ensaio/serviço que você imagina: local, estilo, referências, ocasião…"
                  value={form.briefing}
                  onChange={(e) => setForm({ ...form, briefing: e.target.value })}
                />
              </div>

              <label className="mt-1 flex cursor-pointer select-none items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                  className="mt-0.5 size-4 rounded border-input accent-[var(--primary)]"
                />
                <span className="text-[12.5px] leading-snug text-muted-foreground">
                  Li e concordo com os <span className="text-foreground underline">Termos de uso</span> e a{" "}
                  <span className="text-foreground underline">Política de privacidade</span> (LGPD).
                </span>
              </label>
            </div>

            {submitError && (
              <div className="mt-4 rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
                {submitError}
              </div>
            )}
          </div>
        )}

        {step === 4 && service && date && startTime && protocol && (
          <ConfirmationView
            service={service}
            date={date}
            startTime={startTime}
            endTime={addMinutesToHHmm(startTime, service.durationMinutes)}
            protocol={protocol}
            onExit={() => router.push("/")}
          />
        )}
      </div>

      {step < 4 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[440px] bg-gradient-to-t from-background via-background to-transparent px-5 pb-5 pt-3">
          {step === 1 && (
            <Button
              size="lg"
              className="w-full"
              disabled={!service}
              onClick={() => setStep(2)}
            >
              Continuar <I.ArrowRight size={18} />
            </Button>
          )}
          {step === 2 && (
            <Button
              size="lg"
              className="w-full"
              disabled={!startTime}
              onClick={() => setStep(3)}
            >
              {startTime ? `Reservar ${startTime}` : "Escolha um horário"}{" "}
              <I.ArrowRight size={18} />
            </Button>
          )}
          {step === 3 && (
            <Button size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
              {isPending ? "Enviando…" : "Solicitar agendamento"} <I.Send size={16} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
