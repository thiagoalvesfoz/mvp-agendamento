/**
 * /admin/ajustes/landing — editor da landing page pública.
 *
 * Server Component: carrega configuração da landing via getLandingConfig,
 * passa para o LandingForm (Client) com preview ao vivo.
 */
import Link from "next/link";
import { I } from "@/components/shared/icons";
import { getLandingConfig, getLandingCoverMeta } from "@/features/settings/queries";
import { LandingForm } from "@/features/settings/components/landing-form";

export default async function LandingEditorPage() {
  const [config, cover] = await Promise.all([getLandingConfig(), getLandingCoverMeta()]);
  const coverUrl = cover ? `/api/landing/cover?v=${cover.updatedAt.getTime()}` : null;

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
            Página pública
          </p>
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">Página inicial</h1>
        </div>
      </div>

      {/* ── Form com preview (Client Component) ── */}
      <LandingForm config={config} coverUrl={coverUrl} />
    </div>
  );
}
