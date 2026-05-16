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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-6 pb-3">
        <Link
          href="/admin/ajustes"
          className="press size-9 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          aria-label="Voltar"
        >
          <I.ChevronLeft size={20} />
        </Link>
        <div>
          <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)] leading-none">
            Ajustes
          </p>
          <h1 className="text-[20px] font-semibold tracking-tight leading-tight">
            Retenção de dados
          </h1>
        </div>
      </div>

      <RetentionForm settings={settings} />
    </div>
  );
}
