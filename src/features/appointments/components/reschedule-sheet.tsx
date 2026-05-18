"use client";

import { Sheet } from "@/components/shared/sheet";
import { I } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { adminRescheduleAppointment } from "@/features/appointments/actions";
import { getSlotsAction } from "@/features/booking/client-actions";
import { CalendarPicker } from "@/features/booking/components/calendar-picker";
import { TimeGrid } from "@/features/booking/components/time-grid";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface RescheduleSheetProps {
  appointmentId: string;
  serviceId: string;
  durationMinutes: number;
  /** @db.Date — ler via UTC getters para evitar deslocamento de fuso. */
  currentDate: Date;
  currentStartTime: string;
}

export function RescheduleSheet({
  appointmentId,
  serviceId,
  currentDate,
  currentStartTime,
}: RescheduleSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentDateISO = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, "0")}-${String(currentDate.getUTCDate()).padStart(2, "0")}`;

  function handleOpen() {
    setSelectedDate(null);
    setSlots([]);
    setSelectedTime(null);
    setError(null);
    setOpen(true);
  }

  async function handleDateChange(d: Date) {
    setSelectedDate(d);
    setSelectedTime(null);
    setSlots([]);
    setLoadingSlots(true);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const result = await getSlotsAction(serviceId, iso);
    setSlots(result);
    setLoadingSlots(false);
  }

  function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    setError(null);
    const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    startTransition(async () => {
      const res = await adminRescheduleAppointment(appointmentId, iso, selectedTime);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const canConfirm = selectedDate !== null && selectedTime !== null;
  const selectedISO = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;
  const isCurrentSlot = selectedISO === currentDateISO && selectedTime === currentStartTime;

  return (
    <>
      <Button variant="outline" size="lg" className="w-full" onClick={handleOpen}>
        <I.Calendar size={16} /> Remarcar
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <Sheet.Header
          title="Remarcar agendamento"
          description="Escolha nova data e horário. Protocolo e dados são mantidos."
        />
        <Sheet.Content className="space-y-4">
          <CalendarPicker value={selectedDate} onChange={handleDateChange} />

          {selectedDate && (
            <div>
              <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Horários disponíveis
              </p>
              {loadingSlots ? (
                <div className="py-4 text-center text-[13px] text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <TimeGrid slots={slots} value={selectedTime} onChange={setSelectedTime} />
              )}
            </div>
          )}

          {error && <p className="text-center text-[13px] text-destructive">{error}</p>}
        </Sheet.Content>
        <Sheet.Footer>
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!canConfirm || isCurrentSlot || isPending}
          >
            {isPending ? "Salvando..." : "Confirmar"}
          </Button>
        </Sheet.Footer>
      </Sheet>
    </>
  );
}
