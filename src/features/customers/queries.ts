/**
 * DAL (Data Access Layer) — clientes.
 *
 * Só leitura. Importar somente em Server Components / Server Actions.
 * Nunca re-exportar instâncias do Prisma ou tipos não-serializáveis.
 */
import { db } from "@/lib/db";
import type { AppointmentStatus } from "@prisma/client";

// ─── Tipos retornados ────────────────────────────────────────────

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  socialMedia: string | null;
  createdAt: Date;
  _count: { appointments: number };
};

export type AppointmentSummary = {
  id: string;
  serviceNameSnapshot: string;
  date: Date;
  startTime: string;
  status: AppointmentStatus;
};

export type CustomerDetail = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  socialMedia: string | null;
  createdAt: Date;
  appointments: AppointmentSummary[];
};

// ─── Queries ─────────────────────────────────────────────────────

/**
 * Sugestão de cliente para autocomplete no formulário de novo agendamento.
 * Inclui contagem de agendamentos para o admin avaliar se vale linkar.
 */
export type CustomerSuggestion = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  socialMedia: string | null;
  appointmentsCount: number;
};

/**
 * Busca clientes ativos por nome (case-insensitive, contém).
 * Usada pelo autocomplete do "Novo agendamento" — limite pequeno
 * para manter o dropdown enxuto.
 */
export async function searchCustomersByName(
  query: string,
  limit = 6,
): Promise<CustomerSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const rows = await db.customer.findMany({
    where: {
      anonymizedAt: null,
      name: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      socialMedia: true,
      _count: { select: { appointments: true } },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    socialMedia: r.socialMedia,
    appointmentsCount: r._count.appointments,
  }));
}

/**
 * Lista todos os clientes ativos (não anonimizados), ordenados por nome.
 * Inclui contagem de agendamentos para exibir "X visitas".
 */
export async function listActiveCustomers(): Promise<CustomerRow[]> {
  return db.customer.findMany({
    where: { anonymizedAt: null },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      socialMedia: true,
      createdAt: true,
      _count: { select: { appointments: true } },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Retorna os dados completos de um cliente com histórico de agendamentos,
 * ordenado por data descendente.
 *
 * Retorna null se o cliente não existir OU já estiver anonimizado —
 * a page.tsx trata com notFound().
 */
export async function getCustomerById(id: string): Promise<CustomerDetail | null> {
  const customer = await db.customer.findUnique({
    where: {
      id,
      anonymizedAt: null, // anonimizados não aparecem na tela de detalhe
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      socialMedia: true,
      createdAt: true,
      appointments: {
        select: {
          id: true,
          serviceNameSnapshot: true,
          date: true,
          startTime: true,
          status: true,
        },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
      },
    },
  });

  return customer;
}
