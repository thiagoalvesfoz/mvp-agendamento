import { BottomTabs } from "@/components/admin/bottom-tabs";
import { getPendingCount } from "@/features/appointments/queries";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Layout do painel admin.
 *
 * Protege todas as rotas /admin/* (exceto /admin/login, que tem layout próprio).
 * Renderiza as BottomTabs no rodapé fixo, mobile-first.
 *
 * O middleware.ts já faz a redireção, mas revalidamos a sessão aqui também —
 * defesa em camadas (não confiar só no middleware).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const pendingCount = await getPendingCount();

  return (
    <div className="admin-shell fixed inset-0 mx-auto flex w-full max-w-[440px] flex-col overflow-hidden bg-background">
      <div className="flex h-full flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <main className="phone-scroll flex-1 overflow-y-auto overscroll-contain">{children}</main>
        <BottomTabs pendingCount={pendingCount} />
      </div>
    </div>
  );
}
