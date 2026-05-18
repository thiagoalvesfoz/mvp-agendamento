import { describe, it, expect } from "vitest";
import { computeSlots, toMinutes, toHHmm } from "@/features/booking/slot-engine";
import type { SlotEngineInput } from "@/features/booking/slot-engine";

// BRT = UTC-3 (fixo desde 2019 — sem DST). "HH:mm" BRT = "HH+3:mm" UTC.
// "09:00" BRT = "12:00" UTC. Usado nos testes de earliestSlotStart.
const DATE_ISO = "2026-05-20"; // quarta-feira

function makeInput(overrides: Partial<SlotEngineInput> = {}): SlotEngineInput {
  return {
    durationMinutes: 60,
    availabilities: [{ startTime: "09:00", endTime: "12:00" }],
    appointments: [],
    blockedRanges: [],
    dateIso: DATE_ISO,
    ...overrides,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

describe("toMinutes", () => {
  it("converte HH:mm para minutos desde meia-noite", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("09:00")).toBe(540);
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("17:30")).toBe(1050);
    expect(toMinutes("23:59")).toBe(1439);
  });
});

describe("toHHmm", () => {
  it("converte minutos desde meia-noite para HH:mm", () => {
    expect(toHHmm(0)).toBe("00:00");
    expect(toHHmm(540)).toBe("09:00");
    expect(toHHmm(570)).toBe("09:30");
    expect(toHHmm(1050)).toBe("17:30");
    expect(toHHmm(1439)).toBe("23:59");
  });

  it("é o inverso de toMinutes", () => {
    const cases = ["00:00", "09:00", "09:30", "17:30", "23:30"];
    for (const t of cases) {
      expect(toHHmm(toMinutes(t))).toBe(t);
    }
  });
});

// ─── computeSlots ─────────────────────────────────────────────────────────────

describe("computeSlots", () => {
  // ── 1. Sem availability ───────────────────────────────────────────────────

  it("retorna [] quando availabilities está vazio", () => {
    expect(computeSlots(makeInput({ availabilities: [] }))).toEqual([]);
  });

  // ── 2. Happy path básico ──────────────────────────────────────────────────

  it("gera slots a cada 30 min em um range de 3h para serviço de 60 min", () => {
    // 09:00+60=10:00 ≤ 12:00 até 11:00+60=12:00 ≤ 12:00 (limite fechado)
    expect(
      computeSlots(
        makeInput({
          durationMinutes: 60,
          availabilities: [{ startTime: "09:00", endTime: "12:00" }],
        }),
      ),
    ).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });

  it("gera slots de 30 min para serviço de 30 min", () => {
    expect(
      computeSlots(
        makeInput({
          durationMinutes: 30,
          availabilities: [{ startTime: "09:00", endTime: "10:00" }],
        }),
      ),
    ).toEqual(["09:00", "09:30"]);
  });

  // ── 3. Serviço não cabe no range ──────────────────────────────────────────

  it("retorna [] quando a duração do serviço excede o tamanho do range", () => {
    expect(
      computeSlots(
        makeInput({
          durationMinutes: 90,
          availabilities: [{ startTime: "09:00", endTime: "10:00" }],
        }),
      ),
    ).toEqual([]);
  });

  // ── 4. Fit exato no limite do range (limite fechado) ─────────────────────

  it("inclui slot que termina exatamente em rangeEnd (limite fechado)", () => {
    // 09:00 + 60 = 10:00 = rangeEnd → válido
    expect(
      computeSlots(
        makeInput({
          durationMinutes: 60,
          availabilities: [{ startTime: "09:00", endTime: "10:00" }],
        }),
      ),
    ).toEqual(["09:00"]);
  });

  it("serviço de 90 min em 08:00–10:00 inclui 08:30 (08:30+90=10:00 ≤ 10:00)", () => {
    expect(
      computeSlots(
        makeInput({
          durationMinutes: 90,
          availabilities: [{ startTime: "08:00", endTime: "10:00" }],
        }),
      ),
    ).toEqual(["08:00", "08:30"]);
  });

  // ── 5. Agendamento existente bloqueia slot ───────────────────────────────

  it("bloqueia slots que sobrepõem agendamento existente (sem buffer)", () => {
    // appointment 10:00–11:00 bloqueia 09:30–10:30 (sobreposição) e 10:00–11:00
    const slots = computeSlots(
      makeInput({
        durationMinutes: 60,
        appointments: [{ startTime: "10:00", endTime: "11:00", bufferPre: 0, bufferPos: 0 }],
      }),
    );
    expect(slots).toContain("09:00");
    expect(slots).not.toContain("09:30"); // 09:30–10:30 sobrepõe 10:00–11:00
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("11:00");
  });

  // ── 6. Buffer pré expande o bloqueio para trás ───────────────────────────

  it("bufferPre desloca o início do bloqueio do agendamento para trás", () => {
    // appointment 10:00–10:30, bufferPre=30 → blocked 09:30–10:30
    const slots = computeSlots(
      makeInput({
        durationMinutes: 30,
        appointments: [{ startTime: "10:00", endTime: "10:30", bufferPre: 30, bufferPos: 0 }],
      }),
    );
    expect(slots).toContain("09:00"); // 09:00–09:30: não toca 09:30–10:30
    expect(slots).not.toContain("09:30"); // 09:30–10:00: dentro do buffer
    expect(slots).not.toContain("10:00"); // 10:00–10:30: o appointment em si
    expect(slots).toContain("10:30"); // 10:30–11:00: após o bloqueio
  });

  // ── 7. Buffer pós expande o bloqueio para frente ─────────────────────────

  it("bufferPos desloca o fim do bloqueio do agendamento para frente", () => {
    // appointment 10:00–10:30, bufferPos=30 → blocked 10:00–11:00
    const slots = computeSlots(
      makeInput({
        durationMinutes: 30,
        appointments: [{ startTime: "10:00", endTime: "10:30", bufferPre: 0, bufferPos: 30 }],
      }),
    );
    expect(slots).toContain("09:30"); // antes do bloqueio
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30"); // dentro do buffer pós
    expect(slots).toContain("11:00"); // após o buffer
  });

  // ── 8. Buffer null → tratado como 0 ──────────────────────────────────────

  it("agendamento que termina exatamente no início do slot não bloqueia esse slot", () => {
    // appointment 09:00–10:00 sem buffer → slot 10:00 deve estar livre
    const slots = computeSlots(
      makeInput({
        durationMinutes: 30,
        availabilities: [{ startTime: "09:00", endTime: "11:00" }],
        appointments: [{ startTime: "09:00", endTime: "10:00", bufferPre: 0, bufferPos: 0 }],
      }),
    );
    expect(slots).not.toContain("09:00");
    expect(slots).not.toContain("09:30");
    expect(slots).toContain("10:00"); // off-by-one: start=600, slotStart=600 → start < slotEnd? 600<630 ✓ mas cur<end? 600<600 ✗ → livre
    expect(slots).toContain("10:30");
  });

  // ── 9. BlockedRange parcial ───────────────────────────────────────────────

  it("blockedRange parcial exclui slots sobrepostos", () => {
    const slots = computeSlots(
      makeInput({
        durationMinutes: 60,
        blockedRanges: [{ startTime: "10:00", endTime: "11:00" }],
      }),
    );
    expect(slots).toContain("09:00");
    expect(slots).not.toContain("09:30");
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("11:00");
  });

  // ── 10. BlockedRange full-day (startTime=null) ───────────────────────────

  it("blockedRange de dia inteiro (horários null) retorna []", () => {
    expect(
      computeSlots(makeInput({ blockedRanges: [{ startTime: null, endTime: null }] })),
    ).toEqual([]);
  });

  it("bloqueio de dia inteiro retorna [] mesmo com bloqueios parciais coexistindo", () => {
    expect(
      computeSlots(
        makeInput({
          blockedRanges: [
            { startTime: "10:00", endTime: "11:00" },
            { startTime: null, endTime: null },
          ],
        }),
      ),
    ).toEqual([]);
  });

  // ── 11. Dois blockedRanges que se sobrepõem ───────────────────────────────

  it("dois blockedRanges sobrepostos bloqueiam a união corretamente", () => {
    // blocked 09:30–10:30 e 10:00–11:00 → união 09:30–11:00
    const slots = computeSlots(
      makeInput({
        durationMinutes: 30,
        blockedRanges: [
          { startTime: "09:30", endTime: "10:30" },
          { startTime: "10:00", endTime: "11:00" },
        ],
      }),
    );
    expect(slots).toContain("09:00");
    expect(slots).not.toContain("09:30");
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("11:00");
  });

  // ── 12. earliestSlotStart filtra slots no passado próximo ────────────────

  it("exclui slots anteriores a earliestSlotStart e inclui os posteriores", () => {
    // "09:00" BRT = "12:00" UTC. earliestSlotStart = 12:01 UTC → 09:00 excluído.
    const earliestSlotStart = new Date("2026-05-20T12:01:00.000Z");
    const slots = computeSlots(
      makeInput({
        durationMinutes: 30,
        availabilities: [{ startTime: "09:00", endTime: "12:00" }],
        earliestSlotStart,
      }),
    );
    expect(slots).not.toContain("09:00"); // 12:00Z < 12:01Z → tooEarly
    expect(slots).toContain("09:30"); // 12:30Z > 12:01Z → ok
  });

  it("retorna [] quando earliestSlotStart é posterior a todos os slots do range", () => {
    // todos os slots de 09:00–12:00 estão antes de 15:00 UTC (12:00 BRT)
    const earliestSlotStart = new Date("2026-05-20T15:00:00.000Z"); // 12:00 BRT
    const slots = computeSlots(
      makeInput({
        durationMinutes: 30,
        availabilities: [{ startTime: "09:00", endTime: "12:00" }],
        earliestSlotStart,
      }),
    );
    expect(slots).toEqual([]);
  });

  // ── 13. Múltiplos ranges (manhã + tarde) ─────────────────────────────────

  it("gera slots em múltiplos ranges de disponibilidade não contíguos", () => {
    const slots = computeSlots(
      makeInput({
        durationMinutes: 30,
        availabilities: [
          { startTime: "09:00", endTime: "10:00" },
          { startTime: "14:00", endTime: "15:00" },
        ],
      }),
    );
    expect(slots).toEqual(["09:00", "09:30", "14:00", "14:30"]);
  });

  it("agendamento bloqueando range da manhã não afeta range da tarde", () => {
    const slots = computeSlots(
      makeInput({
        durationMinutes: 30,
        availabilities: [
          { startTime: "09:00", endTime: "10:00" },
          { startTime: "14:00", endTime: "15:00" },
        ],
        appointments: [{ startTime: "09:00", endTime: "10:00", bufferPre: 0, bufferPos: 0 }],
      }),
    );
    // Manhã inteira bloqueada, tarde livre
    expect(slots).not.toContain("09:00");
    expect(slots).not.toContain("09:30");
    expect(slots).toContain("14:00");
    expect(slots).toContain("14:30");
  });
});
