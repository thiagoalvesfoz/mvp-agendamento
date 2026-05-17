"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { I } from "@/components/shared/icons";
import { CustomerCard } from "@/features/customers/components/customer-card";
import { CustomerSkeleton } from "@/features/customers/components/customer-skeleton";
import type { CustomerRow } from "@/features/customers/queries";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch failed");
    return r.json() as Promise<{ customers: CustomerRow[] }>;
  });

export function CustomerList() {
  const { data, error, mutate } = useSWR("/api/admin/clientes", fetcher, {
    revalidateOnFocus: false,
  });
  const [query, setQuery] = useState("");

  const loading = !data && !error;
  const customers = data?.customers ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")),
    );
  }, [query, customers]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-[14px] font-medium">Erro ao carregar clientes</p>
        <button
          type="button"
          onClick={() => void mutate()}
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
            disabled={loading}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        {!loading && (
          <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
            {customers.length} {customers.length === 1 ? "cliente único" : "clientes únicos"} ·
            histórico completo de cada um
          </p>
        )}
      </div>

      {/* ── Lista / Skeleton / Empty state ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {loading ? (
          <CustomerSkeleton />
        ) : filtered.length === 0 ? (
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
