import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BottomTabs } from "@/components/admin/bottom-tabs";

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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-2">{children}</main>
      <BottomTabs />
    </div>
  );
}
