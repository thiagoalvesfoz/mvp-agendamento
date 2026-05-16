/**
 * /admin/ajustes/disponibilidade — editor de disponibilidade semanal.
 *
 * Server Component: carrega todos os registros de Availability do banco,
 * passa como prop para o AvailabilityEditor (Client Component).
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { getAvailability } from "@/features/settings/queries";
import { AvailabilityEditor } from "@/features/settings/components/availability-editor";

export default async function DisponibilidadePage() {
  const rows = await getAvailability();

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 pb-3 pt-6">
        <Link
          href="/admin/ajustes"
          className="press flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          aria-label="Voltar"
        >
          <I.ChevronLeft size={20} />
        </Link>
        <div>
          <p className="text-[12px] font-medium uppercase leading-none tracking-widest text-[var(--muted-foreground)]">
            Ajustes
          </p>
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">
            Disponibilidade
          </h1>
        </div>
      </div>

      {/* ── Editor (Client Component) ── */}
      <AvailabilityEditor rows={rows} />
    </div>
  );
}
