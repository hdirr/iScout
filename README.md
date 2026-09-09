# ⚽ iScout

Plataforma web de scouting profissional focada em **mercados emergentes e menos explorados**, identificando talentos com alto potencial de valorização e custo-benefício.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL) como banco de dados
- **ESLint**

## Começando

```bash
npm install
npm run dev
```

A aplicação roda em [http://localhost:3000](http://localhost:3000).

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra o **SQL Editor** e execute o arquivo [`supabase/schema.sql`](supabase/schema.sql).
3. Copie `URL do projeto` e `anon key` em **Settings → API**.
4. Preencha o `.env.local` (consulte `.env.local.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build de produção |
| `npm run lint` | Verifica lint (ESLint) |

## Estrutura

```
src/
├── app/                  # Rotas (App Router)
│   ├── api/players/      # Route handlers (CRUD)
│   └── jogadores/        # Lista, detalhe, criar e editar
├── components/           # Componentes reutilizáveis
└── lib/
    ├── data/             # Camada de acesso a dados
    ├── supabase/         # Clientes do Supabase
    ├── types/            # Tipos e enums do domínio
    └── utils.ts          # Helpers de formatação
supabase/
└── schema.sql            # Schema PostgreSQL do domínio
```

> O documento central com a especificação completa está em [`documento_central.md`](documento_central.md).