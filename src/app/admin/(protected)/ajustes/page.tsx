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
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
          Painel
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight leading-tight">Ajustes</h1>
      </div>

      {/* ── Conteúdo scrollável ── */}
      <div className="flex-1 overflow-y-auto pb-6">
        {/* ── Card do admin ── */}
        <div className="px-5 pb-4">
          <Link href="/admin/ajustes/perfil" className="press block">
            <Card className="p-3.5 flex items-center gap-3">
              <CustomerAvatar name={adminName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-medium tracking-tight truncate">{adminEmail}</div>
                <div className="text-[12px] text-[var(--muted-foreground)] truncate">
                  Ver perfil
                </div>
              </div>
              <I.Chevron size={16} className="text-[var(--muted-foreground)] shrink-0" />
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
        <div className="px-5 mt-2">
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <form action={logoutAction}>
              <button
                type="submit"
                className="press w-full flex items-center gap-3 px-3.5 py-3 text-left text-[var(--destructive)]"
              >
                <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-[color-mix(in_oklch,var(--destructive)_12%,transparent)]">
                  <I.LogOut size={17} />
                </div>
                <span className="text-[14px] font-medium tracking-tight">Sair do painel</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="px-5 mt-4 text-[11px] text-center text-[var(--muted-foreground)]">
          Estúdio Foz · MVP v1.0
        </p>
      </div>
    </div>
  );
}
