/**
 * /admin/ajustes/retencao — retenção de dados (LGPD).
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { getSettings } from "@/features/settings/queries";
import { RetentionForm } from "@/features/settings/components/retention-form";

export default async function RetencaoPage() {
  const settings = await getSettings();

  return (
    <div className="flex h-full flex-col">
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
            Retenção de dados
          </h1>
        </div>
      </div>

      <RetentionForm settings={settings} />
    </div>
  );
}
