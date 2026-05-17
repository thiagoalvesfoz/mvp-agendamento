/**
 * GET /api/admin/servicos
 *
 * Retorna todos os serviços (ativos + inativos) para o ServiceList client-side.
 * Auth obrigatória — 401 se não houver sessão.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listServices } from "@/features/services/queries";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await listServices({ includeInactive: true });

  const active = all.filter((s) => s.active);
  const inactive = all.filter((s) => !s.active);

  return NextResponse.json({ active, inactive });
}
