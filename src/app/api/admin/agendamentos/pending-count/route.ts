import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPendingCount } from "@/features/appointments/queries";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await getPendingCount();
  return NextResponse.json({ count });
}
