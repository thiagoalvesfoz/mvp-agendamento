# Agenda de Agendamentos

Sistema de agenda online para profissional solo (foto / social media / produção de conteúdo). Também serve como **boilerplate Next.js full-stack** — basta clonar, renomear e adaptar as regras de negócio.

> Status: fase de descoberta / pré-MVP

---

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** estrito
- **Tailwind CSS 3** + **shadcn/ui**
- **Prisma 6** + **PostgreSQL 16** (extensão `btree_gist` para constraint EXCLUDE)
- **Auth.js v5** (NextAuth) com Credentials provider
- **Zod** para validação ponta-a-ponta
- **Vitest** (unit) + **Playwright** (E2E)
- **Docker Compose** para Postgres local
- **ESLint** + **Prettier** + **Husky** + **lint-staged**

---

## Como rodar localmente

### 1. Pré-requisitos

- **Node.js 20+**
- **pnpm 9+** (`npm i -g pnpm`)
- **Docker Desktop** (para o banco local)

### 2. Setup inicial

```bash
# Clone e entre na pasta
cd agenda-agendamentos

# Instale as dependências
pnpm install

# Copie variáveis de ambiente e ajuste
cp .env.example .env.local
# Gere um AUTH_SECRET com: openssl rand -base64 32

# Sobe o Postgres no Docker
pnpm db:up

# Aplica schema (Prisma cria as tabelas)
pnpm db:migrate

# Aplica a constraint EXCLUDE e índices parciais (executado dentro do container)
pnpm db:apply-extras

# Popula admin + serviços + disponibilidade
pnpm db:seed

# Roda em dev
pnpm dev
```

Acesse:

- **Pública**: <http://localhost:3000>
- **Admin**: <http://localhost:3000/admin> (login: `admin@example.com` / `admin123`)

---

## Scripts úteis

| Script                        | O que faz                                                          |
| ----------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                    | Servidor de desenvolvimento                                        |
| `pnpm build`                  | Build de produção                                                  |
| `pnpm start`                  | Serve o build                                                      |
| `pnpm typecheck`              | Checa tipos com `tsc --noEmit`                                     |
| `pnpm lint` / `pnpm lint:fix` | ESLint                                                             |
| `pnpm format`                 | Formata com Prettier                                               |
| `pnpm test`                   | Vitest (watch)                                                     |
| `pnpm test:run`               | Vitest (uma vez)                                                   |
| `pnpm test:e2e`               | Playwright                                                         |
| `pnpm db:up` / `pnpm db:down` | Sobe/desce Postgres no Docker                                      |
| `pnpm db:migrate`             | Aplica migrations do Prisma                                        |
| `pnpm db:apply-extras`        | Aplica SQL manual (EXCLUDE + índices parciais) dentro do container |
| `pnpm db:psql`                | Abre shell `psql` interativo no container                          |
| `pnpm db:seed`                | Popula dados iniciais                                              |
| `pnpm db:studio`              | Abre Prisma Studio                                                 |
| `pnpm db:reset`               | Reseta o banco (cuidado!)                                          |

---

## Estrutura de pastas

```
agenda-agendamentos/
├── prisma/
│   ├── schema.prisma          # Modelos
│   ├── seed.ts                # Dados iniciais
│   ├── init/                  # SQL executado quando o Docker sobe o DB
│   ├── extras/                # SQL manual aplicado após migrate (EXCLUDE + índices parciais)
│   └── migrations/            # Migrations geradas pelo Prisma
├── src/
│   ├── app/                   # Rotas (App Router)
│   │   ├── (admin)/           # Painel administrativo
│   │   ├── (public)/          # Área pública da agenda
│   │   ├── api/               # Route Handlers (quando necessário)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── loading.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── shared/            # Componentes compostos reutilizáveis
│   ├── features/              # Domínios (criar conforme necessário)
│   │   └── <feature>/
│   │       ├── components/
│   │       ├── actions.ts     # Server Actions
│   │       ├── queries.ts     # DAL (leitura)
│   │       ├── schemas.ts     # Zod
│   │       └── types.ts
│   ├── lib/
│   │   ├── auth.ts            # Auth.js config
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── env.ts             # Validação de env com Zod
│   │   ├── time.ts            # Helpers de fuso America/Sao_Paulo
│   │   └── utils.ts           # cn() para Tailwind
│   ├── styles/
│   │   └── globals.css        # Tailwind base + tokens shadcn
│   └── middleware.ts          # Proteção de /admin/*
├── tests/
│   ├── unit/                  # Vitest
│   ├── e2e/                   # Playwright
│   └── setup.ts
├── docker-compose.yml         # Postgres local
├── .env.example
├── README.md
└── package.json
```

---

## Decisões arquiteturais importantes

### Server-first

Server Components por padrão. Marque `"use client"` **apenas** no componente folha que precisa de interatividade. Server Actions são preferidas sobre Route Handlers para mutações.

### Constraint anti-sobreposição (RN01)

A tabela `appointments` tem `EXCLUDE USING gist` que **impede dois agendamentos ativos** no mesmo intervalo. Em colisão, o Postgres retorna erro `23P01` que deve virar HTTP 409 amigável na API. Buffer pré/pós é validado **em código** antes do INSERT — a constraint cobre só o intervalo do atendimento (a rede de proteção final).

### Snapshots em agendamentos (RN15)

Cada agendamento guarda snapshots de serviço e cliente. Edição em `services` ou `customers` **não altera agendamentos passados**. Ajuste de duração em agendamento existente é via RF13 (PATCH `/api/admin/appointments/:id/duration`).

### Fuso horário fixo (RN10)

Toda regra de negócio roda em `America/Sao_Paulo`. **Nunca use `new Date()` direto** — sempre use os helpers de `@/lib/time.ts`. A Vercel roda em UTC e isso geraria bugs sutis.

### Validação no boundary

Todo input externo (form, API, Server Action) passa por schema Zod antes de chegar na lógica. Falha → erro estruturado, nunca exception bruta para o cliente.

---

## Como usar este projeto como boilerplate

Para começar um novo projeto Next.js a partir desta base:

1. **Copie a pasta** com outro nome
2. **Renomeie** `name` em `package.json`
3. **Remova o domínio** (`prisma/schema.prisma`, `prisma/seed.ts`) — mantenha só `AdminUser`, `PasswordResetToken`, `LoginAttempt`, `Settings`
4. **Limpe** `src/features/` — começa vazia
5. **Ajuste** `.env.example` para as variáveis do novo projeto
6. **Atualize** este README

A base que vale a pena manter:

- Toda a configuração de tooling (ESLint, Prettier, Husky, Vitest, Playwright)
- `src/lib/*` (env, db, auth, utils, time)
- Estrutura de pastas e route groups
- Docker Compose para Postgres
- CI básico em `.github/workflows/`

---

## Roteiro de implementação

Ver `documento_tecnico_agenda_agendamentos.pdf` (pasta acima) para o roteiro completo de 5 fases. Estamos na **Fase 1 — Infra e modelagem**.

---

## Convenções de código

- **Imports** — sempre via path alias `@/...` (configurado em `tsconfig.json`)
- **Componentes** — Server Components por padrão; Client só quando necessário
- **Server Actions** — em `features/<feature>/actions.ts`, com `"use server"` no topo
- **Validação** — Zod no boundary, tipos derivados via `z.infer`
- **Naming** — `camelCase` em TS, `snake_case` em SQL (Prisma faz o mapping com `@map`)
- **Comentários** — explique o **porquê**, não o **o quê**

---

## Agentes auxiliares

Este projeto tem dois agentes especializados em `.claude/agents/` (no nível acima):

- **`nextjs-architect`** — arquiteto sênior, escreve e revisa código
- **`product-owner`** — PO com mentalidade de descoberta, valida valor para usuário

Use-os no fluxo: `product-owner` valida a ideia → `nextjs-architect` implementa.
