/**
 * GET /api/admin/ajustes
 *
 * Retorna settings do sistema + dados do admin logado.
 * Auth obrigatória — 401 se não houver sessão.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = session.user?.email ?? "—";
  const userId = (session.user as { id?: string } | undefined)?.id;

  const [settings, adminUser] = await Promise.all([
    getSettings(),
    userId
      ? db.adminUser.findUnique({ where: { id: userId }, select: { lastLoginAt: true } })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    settings,
    adminEmail,
    adminName: adminEmail.split("@")[0] ?? "Admin",
    lastLoginAt: adminUser?.lastLoginAt?.toISOString() ?? null,
  });
}
