"use client";

/**
 * /admin/ajustes — hub de configurações.
 *
 * Client Component: busca settings e dados do admin via fetch no mount.
 * A navegação (links estáticos) é renderizada imediatamente, sem esperar
 * o fetch. O card de perfil e os três valores dinâmicos exibem skeleton
 * enquanto os dados chegam.
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { ListGroup, ListItem } from "@/components/shared/list-group";
import { Card } from "@/components/ui/card";
import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import { I } from "@/components/shared/icons";
import { formatInTZ } from "@/lib/time";
import type { SettingsRow } from "@/features/settings/queries";

// ── Tipos ────────────────────────────────────────────────────────────────────

type AjustesData = {
  settings: SettingsRow;
  adminEmail: string;
  adminName: string;
  lastLoginAt: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Primeiro acesso";
  const d = new Date(iso);
  return `Último acesso ${formatInTZ(d, "dd/MM/yyyy · HH:mm")}`;
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function AdminCardSkeleton() {
  return (
    <div className="flex h-[60px] animate-pulse items-center gap-3 rounded-2xl bg-[var(--muted)] px-3.5">
      <div className="size-9 shrink-0 rounded-full bg-[var(--border)]" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-3.5 w-3/5 rounded bg-[var(--border)]" />
        <div className="h-3 w-2/5 rounded bg-[var(--border)]" />
      </div>
      <div className="h-4 w-4 rounded bg-[var(--border)]" />
    </div>
  );
}

/**
 * Linha de item "settings" com o valor substituído por skeleton.
 * Replica a estrutura visual de ListItem sem depender do componente.
 */
function ListItemValueSkeleton({
  icon,
  title,
  href,
}: {
  icon: ReactNode;
  title: string;
  href: string;
}) {
  return (
    <Link href={href} className="press block">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium tracking-tight">{title}</div>
        </div>
        <div className="h-3 w-14 animate-pulse rounded bg-[var(--muted)]" />
        <I.Chevron size={15} className="shrink-0 text-[var(--muted-foreground)]" />
      </div>
    </Link>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminAjustesPage() {
  const [data, setData] = useState<AjustesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ajustes")
      .then((r) => r.json())
      .then((json: AjustesData) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
          {loading || !data ? (
            <AdminCardSkeleton />
          ) : (
            <Link href="/admin/ajustes/perfil" className="press block">
              <Card className="flex items-center gap-3 p-3.5">
                <CustomerAvatar name={data.adminName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-medium tracking-tight">
                    {data.adminEmail}
                  </div>
                  <div className="truncate text-[12px] text-[var(--muted-foreground)]">
                    {formatLastLogin(data.lastLoginAt)}
                  </div>
                </div>
                <I.Chevron size={16} className="shrink-0 text-[var(--muted-foreground)]" />
              </Card>
            </Link>
          )}
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
          {loading || !data ? (
            <ListItemValueSkeleton
              href="/admin/ajustes/endereco"
              icon={<I.MapPin size={17} />}
              title="Endereço da agenda"
            />
          ) : (
            <Link href="/admin/ajustes/endereco" className="press block">
              <ListItem
                icon={<I.MapPin size={17} />}
                title="Endereço da agenda"
                value={`/${data.settings.publicSlug}`}
              />
            </Link>
          )}
          {loading || !data ? (
            <ListItemValueSkeleton
              href="/admin/ajustes/email"
              icon={<I.Bell size={17} />}
              title="Email para notificações"
            />
          ) : (
            <Link href="/admin/ajustes/email" className="press block">
              <ListItem
                icon={<I.Bell size={17} />}
                title="Email para notificações"
                value={data.settings.notificationEmail}
              />
            </Link>
          )}
        </ListGroup>

        {/* ── Grupo: Privacidade ── */}
        <ListGroup title="Privacidade" className="mt-2">
          {loading || !data ? (
            <ListItemValueSkeleton
              href="/admin/ajustes/retencao"
              icon={<I.Shield size={17} />}
              title="Retenção de dados"
            />
          ) : (
            <Link href="/admin/ajustes/retencao" className="press block">
              <ListItem
                icon={<I.Shield size={17} />}
                title="Retenção de dados"
                subtitle="Anonimização automática após o período"
                value={`${data.settings.retentionMonths} meses`}
              />
            </Link>
          )}
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
