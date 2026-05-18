-- Buffer values removed from appointment snapshot.
-- Slot engine now reads current service buffer values directly.
ALTER TABLE "appointments" DROP COLUMN "buffer_pre_snapshot";
ALTER TABLE "appointments" DROP COLUMN "buffer_pos_snapshot";
