import { auth } from "@/lib/auth";
import { AjustesClient } from "./ajustes-client";

export default async function AdminAjustesPage() {
  const session = await auth();
  const adminEmail = session?.user?.email ?? "—";
  const adminName = adminEmail.split("@")[0] ?? "Admin";
  const lastLoginAt = session?.user?.lastLoginAt ?? null;

  return <AjustesClient adminEmail={adminEmail} adminName={adminName} lastLoginAt={lastLoginAt} />;
}
