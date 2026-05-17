/**
 * /admin/ajustes/perfil — informações do admin logado + histórico de logins.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { I } from "@/components/shared/icons";
import { Card } from "@/components/ui/card";
import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import { formatInTZ } from "@/lib/time";

function formatDateTime(d: Date | null): string {
  if (!d) return "—";
  return formatInTZ(d, "dd/MM/yyyy · HH:mm");
}

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const userId = (session.user as { id?: string }).id;
  const adminEmail = session.user.email ?? "—";
  const adminName = adminEmail.split("@")[0] ?? "Admin";

  const [user, loginHistory] = await Promise.all([
    userId
      ? db.adminUser.findUnique({
          where: { id: userId },
          select: { id: true, email: true, createdAt: true, lastLoginAt: true },
        })
      : null,
    db.loginAttempt.findMany({
      where: { email: adminEmail },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { success: true, ip: true, createdAt: true },
    }),
  ]);

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
          <h1 className="text-[20px] font-semibold leading-tight tracking-tight">Perfil</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* ── Avatar + nome ── */}
        <Card className="mb-4 flex items-center gap-3 p-4">
          <CustomerAvatar name={adminName} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold tracking-tight">{adminName}</div>
            <div className="truncate text-[12.5px] text-[var(--muted-foreground)]">
              {adminEmail}
            </div>
          </div>
        </Card>

        {/* ── Informações da conta ── */}
        <Card className="mb-4 divide-y divide-[var(--border)] p-0">
          <InfoRow icon={<I.Mail size={16} />} label="Email" value={adminEmail} />
          <InfoRow icon={<I.Shield size={16} />} label="Papel" value="Administrador" />
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
          <InfoRow icon={<I.User size={16} />} label="ID" value={user?.id ?? "—"} mono />
        </Card>

        {/* ── Histórico de logins ── */}
        <p className="mb-2 px-1 text-[12px] font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
          Histórico de acesso
        </p>
        <Card className="divide-y divide-[var(--border)] p-0">
          {loginHistory.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-[var(--muted-foreground)]">
              Nenhum acesso registrado ainda.
            </p>
          ) : (
            loginHistory.map((attempt, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    attempt.success
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-[var(--destructive)]"
                  }`}
                >
                  {attempt.success ? <I.Check size={13} /> : <I.Close size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">
                    {attempt.success ? "Acesso autorizado" : "Tentativa negada"}
                  </div>
                  <div className="text-[11.5px] text-[var(--muted-foreground)]">
                    {formatDateTime(attempt.createdAt)}
                    {attempt.ip ? ` · ${attempt.ip}` : ""}
                  </div>
                </div>
              </div>
            ))
          )}
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
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase leading-none tracking-[0.12em] text-[var(--muted-foreground)]">
          {label}
        </div>
        <div
          className={
            "mt-1 truncate text-[13.5px] text-[var(--foreground)]" +
            (mono ? " font-mono text-[12px]" : "")
          }
        >
          {value}
        </div>
      </div>
    </div>
  );
}
