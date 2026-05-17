# CLAUDE.md — Agenda de Agendamentos

## Stack

Next.js 15 (App Router) · React 19 · TypeScript estrito · Tailwind 3 + shadcn/ui · Prisma 6 + PostgreSQL 16 · Auth.js v5 (Credentials) · Zod · Resend · Vitest · Playwright · Docker Compose.

---

## Estrutura de rotas

```
src/app/
├── page.tsx                              # landing pública
├── agendar/page.tsx                      # fluxo de booking (4 steps)
├── api/
│   └── landing/cover/route.ts            # serve imagem de capa
└── admin/
    ├── (public)/login/page.tsx           # sem auth
    └── (protected)/
        ├── layout.tsx                    # auth check + BottomTabs
        ├── page.tsx                      # dashboard (dia/semana/mês/pendentes)
        ├── servicos/
        │   ├── page.tsx
        │   ├── novo/page.tsx
        │   └── [id]/page.tsx
        ├── clientes/
        │   ├── page.tsx
        │   └── [id]/page.tsx
        └── ajustes/
            ├── page.tsx                  # hub
            ├── disponibilidade/page.tsx
            ├── bloqueios/page.tsx
            ├── regras/page.tsx
            ├── landing/page.tsx
            └── retencao/page.tsx
```

---

## Decisões arquiteturais críticas

- **Server-first**: Server Components por padrão; `"use client"` só na folha que precisa.
- **Server Actions** para mutações; Route Handlers para serving de assets.
- **Anti-sobreposição (RN01)**: `EXCLUDE USING gist` em `appointments`. Colisão → erro `23P01` → HTTP 409.
- **Snapshots (RN15)**: agendamentos copiam dados de serviço e cliente na criação. Edições posteriores não mutam histórico.
- **Fuso (RN10)**: `America/Sao_Paulo`. **Nunca `new Date()` direto** — use helpers de `src/lib/time.ts`.
- **Email assíncrono**: disparo sempre em `after()` do Next 15 pós-commit. Dados passados como props — nunca releitura no callback.
- **LGPD soft delete**: nunca deletar registros. `anonymized_at` + campos zerados.
- **Login fora do layout protegido**: `(public)/login` evita loop de redirect infinito.

---

## Implementado

### Client-side

- **RF01 — Disponibilidade**: `getAvailableSlotsForDate()` em `src/features/booking/queries.ts`. Respeita duração do serviço, janela (mín/máx), slots de 30min. Bloqueios recorrentes e buffer pré/pós dos agendamentos existentes não aplicados no cálculo ainda — ver seção Pendências.
- **RF02 — Criar agendamento**: `createAppointment` em `src/features/booking/actions.ts`. Cria PENDING com protocolo único, normaliza telefone (DDI 55), upsert de cliente por telefone, idempotência via `idempotency_key`.
- **RF03 — Confirmação**: tela de sucesso com protocolo + email (`booking-received-customer`). Disparo em `after()` pós-commit.
- **RF04 — Notificação de status**: email ao confirmar (`booking-confirmed-customer`).

### Admin

- **RF05 — Login**: `/admin/login` com Auth.js v5, bcrypt custo 12, sessão JWT 7d, HttpOnly/Secure/SameSite=Lax. `loginAction` / `logoutAction` em `src/features/auth/actions.ts`.
- **RF06 — Serviços**: CRUD em `/admin/servicos`. Soft delete (`deactivateService`), snapshot no agendamento. `src/features/services/`.
- **RF07 — Disponibilidade**: editor semanal `/admin/ajustes/disponibilidade`, múltiplos intervalos por dia. `saveAvailability` usa deleteMany + createMany em transação.
- **RF08 — Bloqueios**: `/admin/ajustes/bloqueios` — pontuais e recorrentes (weekly/yearly). `src/features/settings/`.
- **RF09 — Agendamentos**: dashboard `/admin` com views dia/semana/mês/pendentes. Confirmar, Cancelar, Completar (com `actual_duration_minutes`), No-show. Remarcação: modelo suporta (`rescheduled_to_id`), UI não implementada. `src/features/appointments/`.
- **RF10 — Notificação ao admin**: email via `notifyAdminPending`.
- **RF11 — Configurações**: slug, email de notificação, aviso mínimo, janela máxima, expiração PENDING, retenção LGPD — em `/admin/ajustes/regras` e `/admin/ajustes/retencao`. Singleton `settings` id=1.
- **RF12 — Clientes**: listagem com busca, detalhe com histórico, `anonymizeCustomer` (soft delete em transação). `src/features/customers/`.
- **RF13 — Ajuste de duração**: `updateAppointmentDuration` em `src/features/appointments/actions.ts`. Stepper ±15min (`DurationAdjuster`). Conflito via `23P01` → 409. Registra `duration_change` em `AppointmentHistory`. Só em PENDING/CONFIRMED.

### Regras de negócio ativas

- **RN01** — `EXCLUDE USING gist` em `appointments`. Script em `prisma/extras/init.sql`.
- **RN03** — PENDING/CONFIRMED/COMPLETED bloqueiam slot; CANCELED/EXPIRED/NO_SHOW liberam.
- **RN05/RN06** — antecedência mínima e janela máxima enforçadas em `createAppointment` e no cálculo de slots.
- **RN10** — TZ fixo `America/Sao_Paulo`. Nunca `new Date()` direto — use `src/lib/time.ts`.
- **RN14** — cliente normalizado por telefone, upsert no booking, histórico em `customer_history`.
- **RN15** — snapshots de serviço e cliente gravados na criação do agendamento.
- **RN18** — `AppointmentHistory` loga `status_change` e `duration_change` com campos from/to.
- **RN20** — checkbox de consentimento no step 3 do stepper. `consentAcceptedAt` + `consentVersion: "v1"` gravados. Falta link real para o texto da política.
- **RN22** — direito de exclusão LGPD via `anonymizeCustomer`.
- **RN24** — `duration_minutes_snapshot` (ajustável via RF13) vs `actual_duration_minutes` (preenchido ao completar).

### Infraestrutura / transversal

- Email: Resend + 3 templates React Email (`booking-pending-admin`, `booking-received-customer`, `booking-confirmed-customer`). `EMAIL_DEV_MODE=true` redireciona para sandbox.
- Upload de capa: BYTEA em `landing_cover`, resize via `sharp` (1600px max, WebP 82%), servido em `/api/landing/cover` com ETag.
- Landing pública lê `settings` via `getLandingConfig()`.
- Migrations: `20260515032213_init`, `20260516000001_add_landing_fields_to_settings`, `20260517015343_add_photo_landing_page`.

---

## Pendências técnicas

### Segurança (antes de abrir página pública)

| Item                                  | Onde atacar                                                         |
| ------------------------------------- | ------------------------------------------------------------------- |
| Captcha Cloudflare Turnstile          | `src/features/booking/components/stepper.tsx` + `createAppointment` |
| Rate-limit por IP (5/hora)            | Middleware Next.js ou Vercel Edge Config                            |
| Rate-limit por contato (máx 3 ativos) | `createAppointment` — query antes do INSERT                         |

### Funcionalidade (antes de abrir página pública)

| Item                                                  | Onde atacar                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| Cron expiração de PENDING (cada 15 min)               | `src/app/api/cron/expire-pending/route.ts` via Vercel Cron     |
| Bloqueios recorrentes no cálculo de slots             | `src/features/booking/queries.ts` — `getAvailableSlotsForDate` |
| Bloqueios parciais (start_time/end_time) no cálculo   | Mesmo arquivo                                                  |
| Buffer pré/pós dos agendamentos existentes no cálculo | Mesmo arquivo                                                  |

### Backlog

| Item                                   | Onde atacar                                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Botão "Testar envio de email"~~      | Implementado em `/admin/ajustes/email` — `sendTestEmail` action + `TestEmailButton` component                                                  |
| ~~Log de tentativas de login~~         | Implementado — `loginAction` grava em `login_attempts` (sucesso + falha + IP). Hub mostra último acesso. Perfil mostra histórico (últimas 10). |
| Badge de PENDING no painel             | `src/app/admin/(protected)/layout.tsx` → count query                                                                                           |
| UI de remarcação                       | Nova action + sheet em `src/features/appointments/components/`                                                                                 |
| Cron de anonimização LGPD              | `src/app/api/cron/anonymize/route.ts` via Vercel Cron                                                                                          |
| Recuperação de senha                   | `password_reset_tokens` model existe; falta fluxo + página                                                                                     |
| Link real para política de privacidade | Step 3 do stepper (RN20)                                                                                                                       |

---

## Divergências do protótipo

O protótipo em `../prototipo/` é referência de fluxo/layout. Diferenças intencionais:

| Protótipo                     | Implementação                 | Motivo                      |
| ----------------------------- | ----------------------------- | --------------------------- |
| Duração em minutos ("90 min") | Duração em horas ("1h 30min") | Mais legível para o usuário |

Ao implementar novas telas, seguir a implementação — não o protótipo.

---

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local        # gere AUTH_SECRET: openssl rand -base64 32
pnpm db:up
pnpm db:migrate
pnpm db:apply-extras
pnpm db:seed
pnpm dev
```

Admin: <http://localhost:3000/admin> · seed: `julialimabarros08@gmail.com` / `123123`.

## Scripts úteis

`pnpm typecheck` · `pnpm lint` · `pnpm test:run` · `pnpm test:e2e` · `pnpm db:studio` · `pnpm db:reset`.

---

## Gotchas conhecidos

- **JWTSessionError "no matching decryption secret"**: cookie stale após troca de `AUTH_SECRET`. Limpar cookie no DevTools ou usar aba anônima.
- **Loop em `/admin/login`**: login deve ficar em `(public)/` fora do layout protegido.
- **Migrations e Prisma client desincronizados**: após editar `schema.prisma`, rodar `pnpm db:migrate` + `pnpm exec prisma generate` antes de tocar nas queries.
- **Prisma client travado no Windows**: se `prisma generate` falhar com `EPERM rename`, fechar o dev server, rodar `pnpm exec prisma generate`, reiniciar.
- **`EXCLUDE USING gist`**: não suportado pelo Prisma Schema Language — fica em `prisma/extras/init.sql`, aplicado via `pnpm db:apply-extras`. Em produção (Supabase), rodar manualmente no SQL Editor.
