import { PlaceholderScreen } from "@/components/admin/placeholder-screen";
import { Button } from "@/components/ui/button";
import { I } from "@/components/shared/icons";
import { logoutAction } from "@/features/auth/actions";

export default function AdminAjustesPage() {
  return (
    <div className="flex h-full flex-col">
      <PlaceholderScreen
        title="Ajustes"
        description="Disponibilidade, bloqueios, landing, regras e segurança."
        icon="Settings"
      />
      <div className="px-5 pb-24">
        <form action={logoutAction}>
          <Button variant="outline" size="lg" className="w-full" type="submit">
            <I.LogOut size={16} /> Sair da conta
          </Button>
        </form>
      </div>
    </div>
  );
}
