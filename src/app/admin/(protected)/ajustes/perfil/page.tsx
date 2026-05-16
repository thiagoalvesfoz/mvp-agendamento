/**
 * /admin/ajustes/perfil — informações do admin logado.
 *
 * Server Component: lê sessão + linha em AdminUser para mostrar email,
 * criado em e último login.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { I } from "@/components/shared/icons";
import { Card } from "@/components/ui/card";
import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import { formatDateBR } from "@/lib/time";

function formatDateTime(d: Date | null): string {
  if (!d) return "—";
  const date = formatDateBR(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date} · ${hh}:${mm}`;
}

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const userId = (session.user as { id?: string }).id;
  const adminEmail = session.user.email ?? "—";
  const adminName = adminEmail.split("@")[0] ?? "Admin";

  const user = userId
    ? await db.adminUser.findUnique({
        where: { id: userId },
        select: { id: true, email: true, createdAt: true, lastLoginAt: true },
      })
    : null;

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
            Perfil
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-[13px] text-[var(--muted-foreground)] mb-5">
          Informações da sua conta de administrador.
        </p>

        <Card className="p-4 flex items-center gap-3 mb-4">
          <CustomerAvatar name={adminName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold tracking-tight truncate">
              {adminName}
            </div>
            <div className="text-[12.5px] text-[var(--muted-foreground)] truncate">
              {adminEmail}
            </div>
          </div>
        </Card>

        <Card className="p-0 divide-y divide-[var(--border)]">
          <InfoRow icon={<I.Mail size={16} />} label="Email" value={adminEmail} />
          <InfoRow
            icon={<I.Shield size={16} />}
            label="Papel"
            value="Administrador"
          />
          <InfoRow
            icon={<I.Calendar size={16} />}
            label="Conta criada em"
            value={user?.createdAt ? formatDateTime(user.createdAt) : "—"}
          />
          <InfoRow
            icon={<I.Clock size={16} />}
            label="Último acesso"
            value={user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}
          />
          <InfoRow
            icon={<I.User size={16} />}
            label="ID do usuário"
            value={user?.id ?? "—"}
            mono
          />
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <div className="size-8 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)] leading-none">
          {label}
        </div>
        <div
          className={
            "mt-1 text-[13.5px] text-[var(--foreground)] truncate" +
            (mono ? " font-mono text-[12px]" : "")
          }
        >
          {value}
        </div>
      </div>
    </div>
  );
}
