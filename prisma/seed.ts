/**
 * Seed do banco — dados iniciais para descoberta.
 *
 * Roda com: pnpm db:seed
 *
 * Cria:
 *  - 1 admin (admin@example.com / senha: admin123 — TROQUE EM PROD)
 *  - 5 serviços padrão do nicho (foto/social media)
 *  - Disponibilidade típica (seg-sex 9h-18h, sáb 9h-13h)
 *  - 1 registro de settings
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.info("🌱 Iniciando seed...");

  // --- Admin ---
  const passwordHash = await bcrypt.hash("123123", 12);
  await db.adminUser.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "julialimabarros08@gmail.com",
      passwordHash,
    },
  });
  console.info("✓ Admin: julialimabarros08@gmail.com / 123123");

  // --- Settings ---
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      notificationEmail: "julialimabarros08@gmail.com",
      publicSlug: "minha-agenda",
    },
  });
  console.info("✓ Settings");

  // --- Serviços ---
  const services = [
    { name: "Produção de Conteúdo", durationMinutes: 120, bufferPosMinutes: 15 },
    { name: "Fotografia", durationMinutes: 90, bufferPosMinutes: 30 },
    { name: "Cobertura de Evento", durationMinutes: 240, bufferPosMinutes: 30 },
    { name: "Social Media", durationMinutes: 60, bufferPosMinutes: 15 },
    { name: "Consultoria", durationMinutes: 60, bufferPosMinutes: 0 },
  ];
  for (const s of services) {
    await db.service.create({ data: s }).catch(() => {});
  }
  console.info(`✓ ${services.length} serviços`);

  // --- Disponibilidade (seg=1 ... sex=5, sáb=6) ---
  const availability = [
    { weekDay: 1, startTime: "09:00", endTime: "12:00" },
    { weekDay: 1, startTime: "14:00", endTime: "18:00" },
    { weekDay: 2, startTime: "09:00", endTime: "18:00" },
    { weekDay: 3, startTime: "09:00", endTime: "18:00" },
    { weekDay: 4, startTime: "09:00", endTime: "18:00" },
    { weekDay: 5, startTime: "09:00", endTime: "18:00" },
    { weekDay: 6, startTime: "09:00", endTime: "13:00" },
  ];
  for (const a of availability) {
    await db.availability.create({ data: a }).catch(() => {});
  }
  console.info(`✓ Disponibilidade semanal configurada`);

  console.info("✅ Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
