-- Migration: add_landing_cover_table
-- Cria tabela singleton para armazenar a imagem de capa da landing pública.
-- Tabela separada de `settings` para evitar arrastar o BYTEA em queries comuns.
-- A imagem é gravada/lida pela Server Action uploadLandingCover e pelo route
-- handler GET /api/landing/cover.

CREATE TABLE IF NOT EXISTS "landing_cover" (
  "id"         INTEGER     PRIMARY KEY DEFAULT 1,
  "data"       BYTEA       NOT NULL,
  "mime_type"  TEXT        NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "landing_cover_singleton" CHECK ("id" = 1)
);
