/**
 * /admin/ajustes/landing — editor da landing page pública.
 *
 * Server Component: carrega configuração da landing via getLandingConfig,
 * passa para o LandingForm (Client) com preview ao vivo.
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { getLandingConfig } from "@/features/settings/queries";
import { LandingForm } from "@/features/settings/components/landing-form";

export default async function LandingEditorPage() {
  const config = await getLandingConfig();

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
            Página pública
          </p>
          <h1 className="text-[20px] font-semibold tracking-tight leading-tight">
            Página inicial
          </h1>
        </div>
      </div>

      {/* ── Form com preview (Client Component) ── */}
      <LandingForm config={config} />
    </div>
  );
}
