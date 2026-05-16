/**
 * Card de serviço — Server Component.
 * Recebe dados serializáveis via props; navegação via Link do Next.
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import type { ServiceRow } from "@/features/services/queries";

interface ServiceCardProps {
  service: ServiceRow;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const totalMinutes =
    service.durationMinutes + service.bufferPreMinutes + service.bufferPosMinutes;

  const bufferLabel = (() => {
    const parts: string[] = [];
    if (service.bufferPreMinutes > 0) parts.push(`pré ${service.bufferPreMinutes} min`);
    if (service.bufferPosMinutes > 0) parts.push(`pós ${service.bufferPosMinutes} min`);
    return parts.length > 0 ? `buffer ${parts.join(" · ")}` : null;
  })();

  return (
    <Link
      href={`/admin/servicos/${service.id}`}
      className={cn(
        "press block w-full text-left rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4",
        !service.active && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone genérico — campo icon não existe no schema (fora do MVP) */}
        <div className="size-10 shrink-0 rounded-xl bg-[var(--muted)] flex items-center justify-center">
          <I.Camera size={18} className="text-[var(--muted-foreground)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-medium tracking-tight">{service.name}</span>
            {!service.active && (
              <span className="text-[11px] text-[var(--muted-foreground)] border border-[var(--border)] rounded-full px-2 py-0.5">
                Desativado
              </span>
            )}
          </div>

          {service.description && (
            <p className="mt-1 text-[12.5px] text-[var(--muted-foreground)] line-clamp-2 leading-snug">
              {service.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap text-[12px] text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1">
              <I.Clock size={13} />
              {service.durationMinutes} min
            </span>
            {bufferLabel && (
              <>
                <span>·</span>
                <span>{bufferLabel}</span>
              </>
            )}
            {totalMinutes !== service.durationMinutes && (
              <>
                <span>·</span>
                <span className="font-medium text-[var(--foreground)]">
                  {totalMinutes} min reservados
                </span>
              </>
            )}
          </div>
        </div>

        <I.Edit size={15} className="text-[var(--muted-foreground)] shrink-0 mt-1" />
      </div>
    </Link>
  );
}
