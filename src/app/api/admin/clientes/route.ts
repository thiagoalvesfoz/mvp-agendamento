/**
 * GET /api/admin/clientes
 *
 * Retorna todos os clientes ativos para o CustomerList client-side.
 * Auth obrigatória — 401 se não houver sessão.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listActiveCustomers } from "@/features/customers/queries";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await listActiveCustomers();

  return NextResponse.json({ customers });
}
