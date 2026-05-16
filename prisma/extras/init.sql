-- =========================================================
-- SQL manual: ajustes que o Prisma não gera sozinho
-- =========================================================
-- Aplicado DEPOIS do `pnpm db:migrate` (que cria as tabelas).
-- Contém a constraint EXCLUDE USING gist (RN01) e índices parciais.
--
-- Como aplicar:
--   pnpm db:apply-extras
--
-- Equivalente manual:
--   psql $DATABASE_URL -f prisma/extras/init.sql

-- Garante a extensão (já vem do init do Docker, mas reforçamos)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================================================
-- CONSTRAINT CRÍTICA: impede sobreposição de agendamentos ativos.
-- É a rede de proteção final contra race conditions (RN01 / RN23).
-- Aplica apenas aos status que ocupam slot: PENDING, CONFIRMED, COMPLETED.
-- =========================================================
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    date WITH =,
    tsrange(
      (date + start_time::time)::timestamp,
      (date + end_time::time)::timestamp
    ) WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED', 'COMPLETED'));

-- =========================================================
-- Índices parciais (otimização) — complementam os do schema.prisma
-- =========================================================

-- Customers ativos (não anonimizados)
CREATE INDEX IF NOT EXISTS idx_customers_active
  ON customers (anonymized_at)
  WHERE anonymized_at IS NULL;

-- PENDING aguardando expiração (job a cada 15min)
CREATE INDEX IF NOT EXISTS idx_appointments_pending_expire
  ON appointments (status, created_at)
  WHERE status = 'PENDING';

-- Agendamentos terminais aguardando anonimização (job diário)
CREATE INDEX IF NOT EXISTS idx_appointments_to_anonymize
  ON appointments (status, updated_at)
  WHERE anonymized_at IS NULL
    AND status IN ('CANCELED', 'EXPIRED', 'COMPLETED', 'NO_SHOW');

-- =========================================================
-- Comentários nas tabelas (documentação no banco)
-- =========================================================
COMMENT ON CONSTRAINT appointments_no_overlap ON appointments IS
  'RN01/RN23: impede dois agendamentos ativos no mesmo intervalo na mesma data. Buffer pré/pós é validado em código.';
