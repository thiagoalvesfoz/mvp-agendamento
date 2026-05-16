-- Migration: add_landing_fields_to_settings
-- Adiciona colunas para edição da landing page pública via /admin/ajustes/landing.
-- Todos os campos são opcionais (NULL) — fallback estático definido em queries.ts.

ALTER TABLE "settings"
  ADD COLUMN IF NOT EXISTS "landing_name"        TEXT,
  ADD COLUMN IF NOT EXISTS "landing_tagline"     TEXT,
  ADD COLUMN IF NOT EXISTS "landing_handle"      TEXT,
  ADD COLUMN IF NOT EXISTS "landing_city"        TEXT,
  ADD COLUMN IF NOT EXISTS "landing_about"       TEXT,
  ADD COLUMN IF NOT EXISTS "landing_callout"     TEXT,
  ADD COLUMN IF NOT EXISTS "landing_cover_label" TEXT,
  ADD COLUMN IF NOT EXISTS "landing_cta_label"   TEXT;
