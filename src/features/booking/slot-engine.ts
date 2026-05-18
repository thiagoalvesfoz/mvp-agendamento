import { fromZonedTime } from "date-fns-tz";

export const SLOT_TZ = "America/Sao_Paulo";

export type AvailabilityRange = {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

export type AppointmentForSlot = {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  bufferPre: number; // minutes
  bufferPos: number; // minutes
};

/**
 * Intervalo bloqueado.
 * startTime=null / endTime=null → bloqueia o dia inteiro.
 */
export type BlockedRange = {
  startTime: string | null;
  endTime: string | null;
};

export type SlotEngineInput = {
  durationMinutes: number;
  slotStep?: number; // default 30
  availabilities: AvailabilityRange[];
  appointments: AppointmentForSlot[];
  /** Inclui bloqueios parciais e recorrentes já filtrados para o dia. */
  blockedRanges: BlockedRange[];
  /** Slot start mínimo em UTC. Slots que começam antes são excluídos. */
  earliestSlotStart?: Date | null;
  dateIso: string; // YYYY-MM-DD — para converter HH:mm em UTC ao comparar earliestSlotStart
  timezone?: string; // IANA, default SLOT_TZ
};

type Interval = { start: number; end: number };

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Computa os slots disponíveis para um dia dado o contexto de bloqueios.
 * Pura — sem I/O, sem efeitos colaterais.
 *
 * Regra de limite: slotStart + durationMinutes <= rangeEnd (fechado).
 * Um slot que termina exatamente no fim do range é válido.
 */
export function computeSlots(input: SlotEngineInput): string[] {
  const {
    durationMinutes,
    availabilities,
    appointments,
    blockedRanges,
    earliestSlotStart = null,
    dateIso,
    timezone = SLOT_TZ,
    slotStep = 30,
  } = input;

  if (availabilities.length === 0) return [];

  // Bloqueio de dia inteiro: qualquer BlockedRange com null termina aqui
  if (blockedRanges.some((b) => b.startTime === null || b.endTime === null)) return [];

  // Constrói intervalos bloqueados em minutos
  const blocked: Interval[] = [];

  for (const appt of appointments) {
    blocked.push({
      start: toMinutes(appt.startTime) - appt.bufferPre,
      end: toMinutes(appt.endTime) + appt.bufferPos,
    });
  }

  for (const b of blockedRanges) {
    // Já garantido não-null pelo check acima, mas TypeScript precisa da asserção
    blocked.push({ start: toMinutes(b.startTime!), end: toMinutes(b.endTime!) });
  }

  const slots: string[] = [];

  for (const r of availabilities) {
    let cur = toMinutes(r.startTime);
    const rangeEnd = toMinutes(r.endTime);

    while (cur + durationMinutes <= rangeEnd) {
      const slotEnd = cur + durationMinutes;
      const isBlocked = blocked.some(({ start, end }) => cur < end && start < slotEnd);

      const tooEarly =
        earliestSlotStart != null &&
        fromZonedTime(`${dateIso}T${toHHmm(cur)}:00`, timezone) < earliestSlotStart;

      if (!isBlocked && !tooEarly) slots.push(toHHmm(cur));
      cur += slotStep;
    }
  }

  return slots;
}
