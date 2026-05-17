import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSettings } from "@/features/settings/queries";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();

  return NextResponse.json({ settings });
}
