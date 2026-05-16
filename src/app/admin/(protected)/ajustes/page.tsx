/**
 * /admin/ajustes — hub de configurações.
 *
 * Server Component: lê Settings e sessão do admin no servidor.
 * Navegação entre sub-telas via links Next.js (sem estado client).
 */
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSettings } from "@/features/settings/queries";
import { logoutAction } from "@/features/auth/actions";
import { ListGroup, ListItem } from "@/components/shared/list-group";
import { Card } from "@/components/ui/card";
import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import { I } from "@/components/shared/icons";

export default async function AdminAjustesPage() {
  const [session, settings] = await Promise.all([auth(), getSettings()]);

  const adminEmail = session?.user?.email ?? "—";
  const adminName = adminEmail.split("@")[0] ?? "Admin";

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="px-5 pb-4 pt-6">
        <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
          Painel
        </p>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Ajustes</h1>
      </div>

      {/* ── Conteúdo scrollável ── */}
      <div className="flex-1 overflow-y-auto pb-6">
        {/* ── Card do admin ── */}
        <div className="px-5 pb-4">
          <Link href="/admin/ajustes/perfil" className="press block">
            <Card className="flex items-center gap-3 p-3.5">
              <CustomerAvatar name={adminName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-medium tracking-tight">
                  {adminEmail}
                </div>
                <div className="truncate text-[12px] text-[var(--muted-foreground)]">
                  Ver perfil
                </div>
              </div>
              <I.Chevron size={16} className="shrink-0 text-[var(--muted-foreground)]" />
            </Card>
          </Link>
        </div>

        {/* ── Grupo: Agenda ── */}
        <ListGroup title="Agenda">
          <Link href="/admin/ajustes/disponibilidade" className="press block">
            <ListItem
              icon={<I.Calendar size={17} />}
              title="Disponibilidade semanal"
              subtitle="Dias e horários abertos"
            />
          </Link>
          <Link href="/admin/ajustes/bloqueios" className="press block">
            <ListItem
              icon={<I.Ban size={17} />}
              title="Bloqueios"
              subtitle="Datas pontuais e recorrentes"
            />
          </Link>
          <Link href="/admin/ajustes/regras" className="press block">
            <ListItem
              icon={<I.Clock size={17} />}
              title="Regras gerais"
              subtitle="Antecedência, expiração, limite no futuro"
            />
          </Link>
        </ListGroup>

        {/* ── Grupo: Página pública ── */}
        <ListGroup title="Página pública" className="mt-2">
          <Link href="/admin/ajustes/landing" className="press block">
            <ListItem
              icon={<I.Home size={17} />}
              title="Página inicial"
              subtitle="Nome, sobre e capa exibidos ao cliente"
            />
          </Link>
          <Link href="/admin/ajustes/endereco" className="press block">
            <ListItem
              icon={<I.MapPin size={17} />}
              title="Endereço da agenda"
              value={`/${settings.publicSlug}`}
            />
          </Link>
          <Link href="/admin/ajustes/email" className="press block">
            <ListItem
              icon={<I.Bell size={17} />}
              title="Email para notificações"
              value={settings.notificationEmail}
            />
          </Link>
        </ListGroup>

        {/* ── Grupo: Privacidade ── */}
        <ListGroup title="Privacidade" className="mt-2">
          <Link href="/admin/ajustes/retencao" className="press block">
            <ListItem
              icon={<I.Shield size={17} />}
              title="Retenção de dados"
              subtitle="Anonimização automática após o período"
              value={`${settings.retentionMonths} meses`}
            />
          </Link>
        </ListGroup>

        {/* ── Sair ── */}
        <div className="mt-2 px-5">
          <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--card)]">
            <form action={logoutAction}>
              <button
                type="submit"
                className="press flex w-full items-center gap-3 px-3.5 py-3 text-left text-[var(--destructive)]"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--destructive)_12%,transparent)]">
                  <I.LogOut size={17} />
                </div>
                <span className="text-[14px] font-medium tracking-tight">Sair do painel</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="mt-4 px-5 text-center text-[11px] text-[var(--muted-foreground)]">
          Estúdio Foz · MVP v1.0
        </p>
      </div>
    </div>
  );
}
