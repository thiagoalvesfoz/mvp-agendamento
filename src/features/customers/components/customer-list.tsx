"use client";

/**
 * CustomerList — Client Component.
 *
 * Precisa ser Client porque o campo de busca exige estado local (controlado).
 * Os dados chegam pré-carregados do Server Component pai (page.tsx), evitando
 * fetch no cliente. A filtragem acontece em memória sobre a lista completa.
 *
 * Decisão de trade-off: busca local (memória) vs. query param (server search).
 * Escolhemos local porque:
 *  - O número de clientes de um negócio pequeno raramente passa de alguns centenas.
 *  - Evita round-trip ao servidor a cada keystroke.
 *  - Simplifica o código (sem useSearchParams + Suspense boundary).
 */
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { I } from "@/components/shared/icons";
import { CustomerCard } from "@/features/customers/components/customer-card";
import type { CustomerRow } from "@/features/customers/queries";

interface CustomerListProps {
  customers: CustomerRow[];
}

export function CustomerList({ customers }: CustomerListProps) {
  const [query, setQuery] = useState("");

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

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* ── Campo de busca ── */}
      <div className="px-5 pb-3">
        <div className="relative">
          <I.Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none"
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
        <p className="text-[12px] text-[var(--muted-foreground)] mt-2">
          {total} {total === 1 ? "cliente único" : "clientes únicos"} · histórico completo de cada
          um
        </p>
      </div>

      {/* ── Lista / Empty state ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="size-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center">
              <I.Users size={24} className="text-[var(--muted-foreground)]" />
            </div>
            {query ? (
              <>
                <p className="text-[15px] font-medium tracking-tight">Nenhum cliente encontrado</p>
                <p className="text-[13px] text-[var(--muted-foreground)] max-w-[240px] leading-snug">
                  Tente buscar por outro nome ou telefone.
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-medium tracking-tight">Nenhum cliente ainda</p>
                <p className="text-[13px] text-[var(--muted-foreground)] max-w-[240px] leading-snug">
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
