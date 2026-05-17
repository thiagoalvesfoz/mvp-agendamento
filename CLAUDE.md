# CLAUDE.md — Agenda de Agendamentos

Contexto para retomar trabalho no projeto. Atualize conforme avança.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript estrito · Tailwind 3 + shadcn/ui · Prisma 6 + Postgres 16 · Auth.js v5 (Credentials) · Zod · Vitest · Playwright · Docker Compose.

## Estado atual (2026-05-16)

Fase: **descoberta / pré-MVP**. Estrutura base, login + shell do admin + abas Serviços, Clientes e Ajustes implementadas.

### Implementado

- **Auth.js v5** com Credentials provider + bcrypt (`src/lib/auth.ts`). Sessão JWT 7d.
- **Login admin** em `/admin/login` (`src/app/admin/(public)/login/page.tsx` + `src/features/auth/components/login-form.tsx`).
- **Server Action** `loginAction` / `logoutAction` em `src/features/auth/actions.ts`.
- **Middleware** (`src/middleware.ts`) redireciona `/admin/*` sem sessão → `/admin/login` e vice-versa.
- **Layout protegido** em `src/app/admin/(protected)/layout.tsx` — revalida `auth()` (defesa em camadas) e renderiza `<BottomTabs />`.
- **BottomTabs** com 4 abas (`src/components/admin/bottom-tabs.tsx`): Agenda · Serviços · Clientes · Ajustes.
- **Aba Serviços** — CRUD completo:
  - Listagem com cards clicáveis, toggle "mostrar desativados", empty state.
  - Editor `/admin/servicos/novo` (criação) e `/admin/servicos/[id]` (edição).
  - Steppers de duração/buffer, card de aviso com total reservado, toggle ativo.
  - Soft delete (`deactivateService`) — hard delete proibido por RN15.
  - `src/features/services/` — schemas Zod, DAL (`queries.ts`), Server Actions (`actions.ts`), componentes.
- **Aba Clientes** — listagem + detalhe + LGPD:
  - Listagem `/admin/clientes` com busca local (nome/telefone), contagem de visitas, empty state.
  - Detalhe `/admin/clientes/[id]` com avatar por iniciais, card de contato (WhatsApp link direto), histórico de agendamentos com status badge, seção LGPD.
  - Anonimização LGPD via Server Action `anonymizeCustomer`: soft delete em transaction (Customer + snapshots de Appointments + CustomerHistory). Nunca deleta registro.
  - `src/features/customers/` — schemas Zod, DAL (`queries.ts`), Server Actions (`actions.ts`), componentes.
- **Aba Ajustes** — hub + 4 sub-telas:
  - **Hub** `/admin/ajustes` — card do admin logado, grupos de navegação (Agenda, Página pública, Privacidade), botão logout.
  - **Disponibilidade** `/admin/ajustes/disponibilidade` — editor semanal com toggle por dia, múltiplos intervalos, `saveAvailability` (deleteMany + createMany em transaction).
  - **Bloqueios** `/admin/ajustes/bloqueios` — lista de datas pontuais futuras + bloqueios recorrentes; sheet de criação (data única ou recorrente/weekly/yearly); `createBlockedDate`, `deleteBlockedDate`, `createRecurringBlock`, `deleteRecurringBlock`.
  - **Regras** `/admin/ajustes/regras` — steppers para horas/dias/meses + inputs para slug e email; `updateSettings`.
  - **Landing** `/admin/ajustes/landing` — preview ao vivo + editor de identidade/capa/conteúdo; `updateLanding`.
  - `src/features/settings/` — schemas Zod, DAL (`queries.ts`), Server Actions (`actions.ts`), componentes (5 Client Components).
- **Landing pública** em `src/app/page.tsx` agora lê de `Settings` via `getLandingConfig()` (com fallback estático enquanto a migration não for aplicada).
- **Novos componentes compartilhados**:
  - `src/components/shared/status-badge.tsx` — `StatusBadge` + `StatusDot` para todos os 6 status do enum `AppointmentStatus`.
  - `src/components/shared/list-group.tsx` — `ListGroup`, `ListItem`, `ListItemButton`.
- **Novos componentes UI**: `Switch` em `src/components/ui/switch.tsx`.
- **Novos ícones**: `Plus`, `Edit`, `Ban`, `Search`, `Trash`, `Home`, `Bell`, `Repeat` em `src/components/shared/icons.tsx`.
- **Novos helpers** em `src/lib/time.ts`: `weekdayName`, `weekdayShort`, `monthShort`, `formatDateBR`, `todayISO`.
- **Booking público** scaffold em `src/app/agendar/` + `src/features/booking/`.
- **Prisma**: schema + 3 migrations:
  - `20260515032213_init` — schema base.
  - `20260516000001_add_landing_fields_to_settings` — colunas `landing_*` em `settings`.
  - `20260516000002_add_landing_cover_table` — tabela singleton `landing_cover` (BYTEA + mime_type + updated_at) para imagem de capa da landing.
  - Seed cria admin + 5 serviços + disponibilidade semanal + settings. Extras com `EXCLUDE USING gist` em `appointments`.
- **Upload de capa da landing** — `/admin/ajustes/landing`:
  - Tabela `landing_cover` (singleton id=1) com BYTEA + mime_type.
  - Server Actions `uploadLandingCover` / `removeLandingCover` (`features/settings/actions.ts`): valida magic bytes, redimensiona com `sharp` para 1600px máx, converte para WebP (qualidade 82).
  - Route handler público `GET /api/landing/cover` (`src/app/api/landing/cover/route.ts`) serve o binário com `Cache-Control` curto + ETag por `updated_at`.
  - Landing pública usa `<Image>` quando há capa, cai no `<PhotoPlaceholder>` quando não há.
  - `next.config.mjs`: `serverActions.bodySizeLimit: '6mb'` para acomodar multipart de até 5 MB.
  - Dep adicionada: `sharp`.
- **Email transacional (Resend)** — `src/lib/email/`:
  - `client.ts` — Resend singleton + flag `isEmailEnabled` (true se `RESEND_API_KEY` + `EMAIL_FROM` setados).
  - `send.ts` — `sendEmail({to, subject, react, tag})` com try/catch interno. NUNCA rejeita; falha vira `console.error`. Em `EMAIL_DEV_MODE=true`, redireciona pro `EMAIL_DEV_TO` (sandbox).
  - 3 templates em `templates/` (React Email): `booking-pending-admin`, `booking-received-customer`, `booking-confirmed-customer`. Componentes síncronos puros — `@react-email/render` não suporta async.
  - Gatilhos:
    - `features/booking/notify.ts` — admin (sempre) + cliente (se forneceu email) quando booking público cria PENDING. Disparo via `after()` do Next 15 pós-commit.
    - `features/appointments/notify.ts` — cliente quando admin move pra CONFIRMED (se houver `customerEmailSnapshot`). Também via `after()`.
  - **Decisão de produto (PO)**: emails de CANCELED/EXPIRED para cliente NÃO entram no MVP — cancelamento é tratado por WhatsApp; email vira ruído.
  - **Decisão arquitetural**: `lib/env.ts` faz `superRefine` exigindo `EMAIL_FROM` quando `RESEND_API_KEY` está setada. Falha rápida em prod evita no-op silencioso.
  - Dados do email são SEMPRE passados como props — nunca releitura no callback `after()`. Snapshots do appointment cobrem o caso de mutação posterior.
- **Tooling**: ESLint, Prettier, Husky, Vitest, Playwright configurados.

### Estrutura de rotas

```
src/app/
├── page.tsx                          # landing pública
├── agendar/                          # fluxo cliente (scaffold)
├── api/
└── admin/
    ├── (public)/login/page.tsx       # /admin/login — sem auth
    └── (protected)/                  # /admin/* — auth + tabs
        ├── layout.tsx
        ├── page.tsx                  # Agenda (placeholder)
        ├── servicos/
        │   ├── page.tsx              # listagem de serviços
        │   ├── novo/page.tsx         # criação
        │   └── [id]/page.tsx         # edição
        ├── clientes/
        │   ├── page.tsx              # listagem de clientes (busca local)
        │   └── [id]/page.tsx         # detalhe + histórico + LGPD
        └── ajustes/
            ├── page.tsx              # hub — card admin, navegação por grupo
            ├── disponibilidade/page.tsx  # editor de disponibilidade semanal
            ├── bloqueios/page.tsx        # lista + sheet de criação
            ├── regras/page.tsx           # editor de Settings (regras + slug + email)
            └── landing/page.tsx          # editor da landing pública
```

### Fora do MVP — campos do protótipo não mapeados no schema

Os seguintes campos existem no protótipo visual (`prototipo/admin-screens.jsx`) mas **não foram implementados** porque não há coluna correspondente no `schema.prisma`:

- **`icon`** — ícone do serviço (picker visual). Atualmente exibe `I.Camera` fixo no card.
- **`tag`** — etiqueta de destaque (ex.: "Mais procurado"). Badge não renderizado.
- **`starting`** — "valor de partida" (ex.: "a partir de R$ 680"). Campo omitido.

Para adicionar qualquer um deles: criar migration adicionando a coluna em `services`, atualizar `schemas.ts`, `queries.ts` e os componentes de lista/form.

**Atenção**: login **deve** ficar em `(public)/`. Aninhar no layout protegido causa loop infinito de redirect (layout chama `auth()` → null → redirect `/admin/login` → rerender layout → loop).

## Decisões arquiteturais críticas

- **Server-first**: Server Components por padrão; `"use client"` só na folha que precisa.
- **Server Actions** preferidas sobre Route Handlers para mutações.
- **Anti-sobreposição (RN01)**: `EXCLUDE USING gist` em `appointments` cobre intervalo final; buffer pré/pós validado em código antes do INSERT. Colisão → erro `23P01` vira HTTP 409.
- **Snapshots (RN15)**: agendamentos copiam dados de serviço e cliente. Edição em `services`/`customers` não muta histórico.
- **Fuso (RN10)**: tudo em `America/Sao_Paulo`. **Nunca `new Date()` direto** — use helpers de `@/lib/time.ts` (Vercel roda UTC).
- **Validação no boundary**: Zod em todo input externo. Falha → erro estruturado.

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local        # gere AUTH_SECRET com openssl rand -base64 32
pnpm db:up
pnpm db:migrate
pnpm db:apply-extras
pnpm db:seed
pnpm dev
```

Admin: <http://localhost:3000/admin> · seed: `admin@example.com` / `admin123`.

## Scripts úteis

`pnpm typecheck` · `pnpm lint` · `pnpm test:run` · `pnpm test:e2e` · `pnpm db:studio` · `pnpm db:reset`.

## Gotchas conhecidos

- **JWTSessionError "no matching decryption secret"**: cookie `authjs.session-token` ficou stale depois de troca de `AUTH_SECRET`. Limpar cookie no DevTools ou usar aba anônima.
- **Loop em `/admin/login`**: garantir que login fica em `(public)/` fora do layout protegido.
- **`useEffect` import**: lembre que `useEffect` precisa de import explícito mesmo dentro de `"use client"`.
- **Migrations e Prisma client desincronizados**: se você editar `schema.prisma` e adicionar uma migration SQL manual, lembre de rodar `pnpm db:migrate` + `pnpm exec prisma generate` antes de tocar nas queries — senão o TS não enxerga o novo model/coluna. Em código de produção, evite carregar com `as any`: corrija o client primeiro.
- **Prisma client travado no Windows**: se `prisma generate` falhar com `EPERM rename`, o dev server está usando a DLL. Feche o servidor (`Ctrl+C`), rode `pnpm exec prisma generate`, depois reinicie com `pnpm dev`.

## Próximos passos sugeridos

1. **Agenda** dia/semana/mês ligando em `features/appointments/`.
2. **Recuperação de senha** por email (Resend já configurado — falta o fluxo de token + página).
3. (Opcional) Seed para campos landing — marcar TODO no seed.ts.
4. (Opcional) Adicionar campos `icon`, `tag`, `starting` em `services` — ver seção "Fora do MVP" acima.
5. (Opcional) Job de anonimização automática após `retentionMonths` (configurável em Settings — já editável em `/admin/ajustes/regras`).
6. (Opcional) Lembretes D-1 e T-2h via cron — usar mesma infra de email já implementada.

## Convenções

- Imports via `@/...` (alias).
- `camelCase` em TS, `snake_case` em SQL (via `@map`).
- Comentários explicam **porquê**, não **o quê**.
- Componentes shadcn em `src/components/ui/`; compostos em `src/components/shared/` ou `features/<x>/components/`.

## Referências

- Requisitos: `documento_requisitos_mvp_agenda_v5.md` (workspace root).
- Documento técnico: `documento_tecnico_agenda_agendamentos.pdf`.
- Protótipo HTML/JSX: `../prototipo/` — referência visual e de fluxo. **Não é código de produção**.
- Agentes: `nextjs-architect` (implementa), `product-owner` (valida valor).
