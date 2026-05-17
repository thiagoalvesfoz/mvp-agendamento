/**
 * GET /api/landing/cover
 *
 * Serve a imagem de capa da landing pública.
 * Rota pública (sem auth) — landing é acessível por qualquer visitante.
 *
 * Cache:
 *  - ETag baseado em updated_at; navegador revalida com If-None-Match.
 *  - max-age curto pois o cliente pode trocar a capa a qualquer momento;
 *    o cache-buster `?v=<timestamp>` na URL garante atualização imediata.
 */
import { NextResponse } from "next/server";
import { getLandingCoverBinary } from "@/features/settings/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cover = await getLandingCoverBinary();

  if (!cover) {
    return new NextResponse(null, { status: 404 });
  }

  const etag = `"${cover.updatedAt.getTime().toString(36)}"`;
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return new NextResponse(new Uint8Array(cover.data), {
    status: 200,
    headers: {
      "Content-Type": cover.mimeType,
      "Content-Length": cover.data.byteLength.toString(),
      "Cache-Control": "public, max-age=300, must-revalidate",
      ETag: etag,
    },
  });
}
