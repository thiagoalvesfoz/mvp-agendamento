"use client";

/**
 * CustomerList — Client Component.
 *
 * Busca os dados de clientes internamente via fetch client-side ao montar,
 * eliminando o bloqueio de navegação causado pelo await no Server Component.
 * O campo de busca continua filtrando em memória sobre a lista completa —
 * sem round-trip ao servidor a cada keystroke.
 *
 * Decisão de trade-off: busca local (memória) vs. query param (server search).
 * Mantida como local porque:
 *  - O número de clientes de um negócio pequeno raramente passa de alguns centenas.
 *  - Evita round-trip ao servidor a cada keystroke.
 *  - Simplifica o código (sem useSearchParams + Suspense boundary).
 */
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { I } from "@/components/shared/icons";
import { CustomerCard } from "@/features/customers/components/customer-card";
import { CustomerSkeleton } from "@/features/customers/components/customer-skeleton";
import type { CustomerRow } from "@/features/customers/queries";

export function CustomerList() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  async function fetchData() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/clientes");
      if (!res.ok) throw new Error("fetch failed");
      const json = (await res.json()) as { customers: CustomerRow[] };
      setCustomers(json.customers);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")),
    );
  }, [query, customers]);

  const total = customers.length;

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Search bar placeholder */}
        <div className="px-5 pb-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-[var(--muted)]" />
          <div className="mt-2 h-3 w-40 animate-pulse rounded bg-[var(--muted)]" />
        </div>
        <div className="flex-1 overflow-hidden px-5">
          <CustomerSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-[14px] font-medium">Erro ao carregar clientes</p>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="press text-[13px] text-[var(--primary)]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Campo de busca ── */}
      <div className="px-5 pb-3">
        <div className="relative">
          <I.Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <Input
            className="pl-10"
            placeholder="Buscar por nome ou telefone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
          {total} {total === 1 ? "cliente único" : "clientes únicos"} · histórico completo de cada
          um
        </p>
      </div>

      {/* ── Lista / Empty state ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--muted)]">
              <I.Users size={24} className="text-[var(--muted-foreground)]" />
            </div>
            {query ? (
              <>
                <p className="text-[15px] font-medium tracking-tight">Nenhum cliente encontrado</p>
                <p className="max-w-[240px] text-[13px] leading-snug text-[var(--muted-foreground)]">
                  Tente buscar por outro nome ou telefone.
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-medium tracking-tight">Nenhum cliente ainda</p>
                <p className="max-w-[240px] text-[13px] leading-snug text-[var(--muted-foreground)]">
                  Os clientes aparecem aqui quando realizam o primeiro agendamento.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((c) => (
              <CustomerCard key={c.id} customer={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
