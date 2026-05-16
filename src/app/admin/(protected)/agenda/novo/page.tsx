/**
 * /admin/agenda/novo — Criação manual de agendamento (tela cheia).
 *
 * Server Component. Pré-busca serviços ativos + datas bloqueadas para o
 * `CreateAppointmentForm` (Client Component que cuida da interação).
 *
 * Query string opcional: `?date=YYYY-MM-DD` pré-seleciona a data foco
 * (usado quando o admin vem da aba Agenda com um dia já selecionado).
 */
import { todayISO } from "@/lib/time";
import { listServices } from "@/features/services/queries";
import { getBlockedDatesForCalendar } from "@/features/booking/queries";
import { CreateAppointmentForm } from "@/features/appointments/components/create-appointment-form";

interface NovoAgendamentoPageProps {
  searchParams: Promise<{ date?: string }>;
}

function parseDate(raw: string | undefined, fallback: string): string {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}

export default async function NovoAgendamentoPage({ searchParams }: NovoAgendamentoPageProps) {
  const params = await searchParams;
  const today = todayISO();
  const initialDate = parseDate(params.date, today);

  const [services, blockedDates] = await Promise.all([
    listServices(),
    getBlockedDatesForCalendar(),
  ]);

  return (
    <CreateAppointmentForm
      services={services}
      initialDate={initialDate}
      blockedDates={blockedDates}
    />
  );
}
