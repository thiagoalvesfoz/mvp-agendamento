# CLAUDE.md — Agenda de Agendamentos

## Stack

Next.js 15 (App Router) · React 19 · TypeScript estrito · Tailwind 3 + shadcn/ui · Prisma 6 + PostgreSQL 16 · Auth.js v5 (Credentials) · Zod · Resend · Vitest · Playwright · Docker Compose.

---

## Decisões arquiteturais críticas

- **Server-first**: Server Components por padrão; `"use client"` só na folha que precisa.
- **Server Actions** para mutações; Route Handlers para serving de assets.
- **Slot engine puro**: lógica de cálculo de slots em `src/features/booking/slot-engine.ts` — sem `server-only`, sem Prisma, testável isoladamente. `queries.ts` é casca fina de I/O.
- **Prisma Extension (anonymizedAt)**: `db` em `src/lib/db.ts` injeta `anonymizedAt: null` automaticamente em `findMany`/`findFirst` de `customer`. Caller pode sobrescrever.
- **Anti-sobreposição (RN01)**: `EXCLUDE USING gist` em `appointments`. Colisão → erro `23P01` → HTTP 409. Não suportado pelo Prisma Schema Language — fica em `prisma/extras/init.sql`, aplicado via `pnpm db:apply-extras`. Em produção (Supabase), rodar manualmente no SQL Editor.
- **Snapshots (RN15)**: agendamentos copiam dados de serviço e cliente na criação. Edições posteriores não mutam histórico. `duration_minutes_snapshot` (ajustável) vs `actual_duration_minutes` (preenchido ao completar).
- **Status que bloqueiam slot (RN03)**: PENDING/CONFIRMED/COMPLETED. CANCELED/EXPIRED/NO_SHOW liberam.
- **Fuso (RN10)**: `America/Sao_Paulo`. **Nunca `new Date()` direto** — use helpers de `src/lib/time.ts`.
- **Datas `@db.Date` no front**: Prisma serializa como `YYYY-MM-DDT00:00:00.000Z`. Em browser BRT, `getDate()` retorna o dia anterior — sempre ler via getters UTC ou via helpers em `src/features/appointments/date-helpers.ts`.
- **Email assíncrono**: disparo sempre em `after()` do Next 15 pós-commit. Dados passados como props — nunca releitura no callback.
- **LGPD soft delete**: nunca deletar registros. `anonymized_at` + campos zerados.
- **Login fora do layout protegido**: `(public)/login` evita loop de redirect infinito.
- **Página híbrida (Server + Client)**: páginas com dados de sessão usam Server Component fino que extrai da sessão e passa como props para Client Component — sem query ao DB, sem skeleton no primeiro render. Padrão em `ajustes/page.tsx` + `ajustes-client.tsx`.
- **`loading.tsx` e isolamento de Suspense**: rotas com fetch têm `loading.tsx` real; rotas sem fetch exportam `export default function Loading() { return null; }` para criar boundary isolado. Sem o `null`, rotas filhas herdam o `loading.tsx` mais próximo acima.
- **`lastLoginAt` no JWT**: `authorize` em `src/lib/auth.ts` captura `new Date()` no login e salva no token via callback `jwt`. Disponível em `session.user.lastLoginAt` sem query ao DB. Após re-login atualiza; durante sessão ativa permanece fixo no horário do login.

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

`pnpm typecheck` · `pnpm lint` · `pnpm test:run` · `pnpm test:e2e` · `pnpm analyze` · `pnpm db:studio` · `pnpm db:reset`.

---

## Gotchas conhecidos

- **JWTSessionError "no matching decryption secret"**: cookie stale após troca de `AUTH_SECRET`. Limpar cookie ou usar aba anônima.
- **Loop em `/admin/login`**: login deve ficar em `(public)/` fora do layout protegido.
- **Migrations e Prisma client desincronizados**: após editar `schema.prisma`, rodar `pnpm db:migrate` + `pnpm exec prisma generate` antes de tocar nas queries.
- **Prisma client travado no Windows**: se `prisma generate` falhar com `EPERM rename`, fechar o dev server, rodar `pnpm exec prisma generate`, reiniciar.
- **Skeleton herdado em todas as rotas**: se uma rota filha não tiver `loading.tsx` próprio, herda o do pai mais próximo. Rotas sem fetch devem retornar `null`.
- **iOS Safari**: `.press` em `globals.css` inclui `touch-action: manipulation` + `cursor: pointer` (evita conflito com swipe-back). Inputs `type="date"`/`time"` requerem `min-w-0 overflow-hidden` no wrapper e `min-w-0` no `Input` para respeitar largura do container.

---

## Protótipo

Referência de fluxo/layout em `../prototipo/`. Ao implementar, seguir o código atual — não o protótipo.
</content>
