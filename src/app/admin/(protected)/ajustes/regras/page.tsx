/**
 * /admin/ajustes/regras — editor de regras gerais (Settings id=1).
 *
 * Server Component: carrega Settings e passa para o RulesForm (Client).
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { getSettings } from "@/features/settings/queries";
import { RulesForm } from "@/features/settings/components/rules-form";

export default async function RegrasPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
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
          <h1 className="text-[20px] font-semibold tracking-tight leading-tight">Regras gerais</h1>
        </div>
      </div>

      {/* ── Form (Client Component) ── */}
      <RulesForm settings={settings} />
    </div>
  );
}
