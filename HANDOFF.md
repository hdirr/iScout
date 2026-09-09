# HANDOFF — iScout

Documento de contexto para novos agentes/sessões. Atualizado ao final de cada milestone.

> Regra do projeto: **atualize este arquivo ao final de cada milestone** (features, mudanças de arquitetura, decisões, pendências).

---

## ⚠️ MODO DEMONSTRAÇÃO (ATIVO — reativar após apresentar ao clube)

Acesso liberado para mostrar o SaaS ao CEO do clube (request do usuário, commit próprio):

- `src/proxy.ts` → **pass-through** (`NextResponse.next()`, `matcher: []`): `/jogadores*` não exige login;
  `/entrar` e `/registrar` continuam funcionando.
- `src/app/api/players/route.ts` e `src/app/api/players/[id]/route.ts` → **sem checagem `isAuthed`** (401 removido).
- **Para reativar a proteção** (quando o usuário pedir):
  1. Restaurar `src/proxy.ts` do commit `8ee2d68` (proxy com `updateSession` + matcher `/jogadores/:path*`, `/entrar/:path*`, `/registrar/:path*`).
  2. Re-adicionar `if (!(await isAuthed())) return 401` nos dois route handlers (estado do commit `8ee2d68`).
  3. Rodar `supabase/security.sql` no SQL Editor (fecha acesso anônimo no banco).
- Lembrar no fim da demo: **restaurar + reabilitar auth + security.sql**. Não esquecer de atualizar este bloco.

---

## Resumo

SaaS de scouting de jogadores focado em mercados emergentes. Spec completa em `documento_central.md`. Repo remoto: `https://github.com/hdirr/iScout.git` (branch `main`).

## Stack

- Next.js **16.3.4** (App Router, `src/`) + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth) — cliente `@supabase/supabase-js@2.116.0` + `@supabase/ssr`
- ESLint 9 (config `eslint.config.mjs`), build via Turbopack

### ATENÇÃO — Next.js 16 (quebras vs. 15/treino)

- **`middleware.ts` virou `proxy.ts`** (em `src/` no nosso caso). Importante: ler docs em `node_modules/next/dist/docs/`.
- `params` / `searchParams` de páginas, e `ctx.params` de route handlers são **Promises** (`await`).
- Layouts e páginas são Server Components por padrão; `"use client"` para interatividade.
- Helper `RouteContext<"/api/...">` e `LayoutProps<"/...">` são globais.
- script `npm.cmd` no PowerShell (execução de `.ps1` bloqueada no Windows).

## Estado atual (comandos)

| O que | Status |
|---|---|
| Git + remoto + commits | ok — `main` no `hdirr/iScout` |
| Supabase conectado (url + publishable key no `.env.local`) | ok |
| Schema rodado no SQL Editor | ok |
| CRUD de jogadores | ok |
| Autenticação (Supabase Auth) | ok — email/senha + proteção de rotas |
| RLS restrito a autenticados | pendente — rodar `supabase/security.sql` |
| Dados de mercado (Série A/B 2026) | ok — 400 jogadores via seed (p/ demo) |
| Dashboard com busca simplificada (seção 7 doc) | ok — busca por jogador ou time em `/jogadores` |

## Dashboard de busca `(/jogadores)`

- **`buscarJogadores(filters)`** em `src/lib/data/players.ts` busca uma única query aninhada
  `players + season_stats + player_injuries + player_evaluations` (PostgREST embeds) e agrega
  em memória → `PlayerSummary` (última temporada, total gols/assistências, total lesões,
  maior dias afastado, última avaliação).
- **Busca simples no campo `busca`**: casa `nome_completo` / `nome_usual` / `apelido` **OU**
  `clube_atual` / `liga_atual`, **ignorando acentos e caixa** (ex.: `sao paulo` encontra "São Paulo").
- **Regras definidas** (importante para não gerar conflitos):
  - Desempenho (gols, assist, xG, xA, desarmes, precisão de passes, mín. jogos) aplicado à **última temporada**.
  - Lesões: `maxDiasAfastado` compara com a **pior lesão**; `/tipo/gravidade/recidiva` = pelo menos uma lesão que satisfaça.
  - Scout (recomendação, scout, potencial, data) aplicado à **última avaliação** (por `data_avaliacao`).
  - Precisão de passes = `passes_completos/passes_tentados * 100` na última temporada.
- **UI** (request do usuário: "busca simples por time ou jogador, métricas importantes, ferramenta fácil"):
  `src/components/jogadores-filtros.tsx` é um form compacto com **campo único de busca** (jogador OU time),
  três seletores-chave (Posição, Disponibilidade, Recomendação do scout), ordenação (Nome/Idade/Posição/Clube/
  Nota/Valor + direção) e botões Buscar/Limpar. A tabela mostra as métricas importantes: Jogador, Posição,
  Clube/Liga, Temporada (jogos), Gols · Assist, Dias afastado, Recomendação, Valor, Nota e Status.
- **Nota de escala**: com muitos players, migrar a agregação para função RPC no Postgres
  (`LIMITE_CARREGAMENTO = 1000` no data layer).
- **Atenção**: os embeds do PostgREST vêm com nome de tabela (`player_injuries`, `player_evaluations`) — o
  data layer renomeia para `injuries`/`evaluations` (erro clássico "jogador.evaluations is not iterable").
- Banco agora tem o **mercado brasileiro (Séries A e B 2026)**: 400 jogadores reais (10 destaques por clube, 20
  clubes de cada série), cada um com temporada 2025/2026, ~34% com lesão(s) e ~72% com avaliação do scout —
  ver seção "Mercado brasileiro" abaixo.

## Mercado brasileiro (Séries A e B 2026)

- Pedido do usuário: focar no mercado brasileiro p/ demo. **400 jogadores** inseridos (10 destaques por clube ×
  20 clubes Série A + 20 clubes Série B), todos com `clube_atual`, `liga_atual` ("Campeonato Brasileiro Série
  A/B"), `pais_clube = "Brasil"`.
- **Nomes reais** de elencos 2026 pesquisados na web (via agentes de pesquisa); stats/lesões/avaliações são
  **gerados de forma plausível** (seed demo) com valores condizentes com divisão (elite A > A > B), posição e idade.
- **Seed**: `scripts/seed-brasileirao-2026.js` (determinístico — PRNG com seed fixo `20260909`). Lê os elencos em
  `scripts/data/rosters/*.json` (nome + posição/pé/altura/peso/nascimento/nacionalidade), gera temporada
  2025/2026, lesões (~34%, 1 ou 2 por jogador quando houver), avaliações (~72%) e grava no Supabase.
  **Atenção: o script apaga TODOS os jogadores antes de inserir (purge total).**
- Como rodar: `node scripts/seed-brasileirao-2026.js` na raiz do projeto (usa chaves do `.env.local`).
- Ênfase: para a demo, clubes são apenas `clube_atual` (texto) — não existe tabela `clubes` no schema ainda.

## Autenticação — como funciona

- **Proxy** (`src/proxy.ts` + `src/lib/supabase/proxy.ts`): roda em `/jogadores/*`, `/entrar`, `/registrar`; faz refresh de sessão e redireciona usuário não logado de `/jogadores*` → `/entrar?next=...`.
- **DAL** (`src/lib/dal.ts`): `getCurrentUser()` (cache por render), `requireUser()`, `isAuthed()`.
- **Server actions** (`src/app/(auth)/actions.ts`): `entrar`, `registrar`, `sair` (lógica server-side via Supabase Auth).
- **Páginas**: `/entrar`, `/registrar` (grupo `(auth)` com layout próprio sem header).
- **UI**: header dinâmico em `(app)/layout.tsx` mostra e-mail + botão Sair quando logado.
- **API**: route handlers de `/api/players*` retornam **401** se não houver sessão.

### Nota — confirmação de e-mail
O projeto Supabase tem **confirmação de e-mail ativa**. Ao registrar, o usuário recebe e-mail de confirmação antes de poder logar. Para dev mais rápido, dá pra desativar em **Authentication → Providers → Email** (desmarcar *Confirm email*) no dashboard do Supabase. `entrar` detecta e-mail não confirmado e mostra mensagem específica.

## Estrutura de arquivos

```
src/
├── proxy.ts                  # proteção de rotas + refresh de sessão (ex-middleware)
├── app/
│   ├── (app)/                # grupo com header — / e /jogadores
│   │   ├── layout.tsx        # header dinâmico (e-mail + Sair / Entrar)
│   │   ├── page.tsx          # home
│   │   └── jogadores/        # lista, [id], [id]/editar, novo
│   ├── (auth)/               # grupo sem header
│   │   ├── actions.ts        # entrar / registrar / sair (server actions)
│   │   ├── layout.tsx
│   │   └── entrar|registrar/
│   └── api/players/          # route handlers (POST / PATCH / DELETE) c/ 401
├── components/               # player-form, delete-player-button, sign-in/up-form, jogadores-filtros
└── lib/
    ├── dal.ts                # getCurrentUser / requireUser / isAuthed
    ├── data/players.ts       # camada de dados (usa cookie session)
    ├── supabase/             # client.ts, server.ts, proxy.ts
    ├── types/                # enums.ts, player.ts, index.ts
    └── utils.ts
supabase/
├── schema.sql                # schema já rodado
└── security.sql              # RLS restrito a authenticated (rodar no SQL Editor)
```

## Variáveis de ambiente (`.env.local`, fora do git)

```
NEXT_PUBLIC_SUPABASE_URL=https://kqvhyfoscguunwxererm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_DtW0VJpOFpcUAujMr4eKfA_zYX_1Gl0
# opcional — usado no link de confirmação de e-mail
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Modelo em `.env.local.example`.

## Banco (Supabase)

- Tabelas: `players`, `season_stats`, `player_injuries`, `player_evaluations` (com enums Postgres).
- Auth: e-mail/senha via Supabase Auth; confirmação de e-mail ativa.
- RLS: políticas atualmente **abertas** (anon+authenticated) — `supabase/security.sql` restringe a `authenticated`; **rodar no SQL Editor**.
- Nota: publishable key (`sb_publishable_...`) funciona como a anon key no supabase-js.
- PowerShell envia texto em codificação que quebra acentos ("í" → "?"). Para testar API via shell, use UTF-8 explícito (`[Text.Encoding]::UTF8.GetBytes(...)`).

## Botões / URLs

- `POST /api/players`, `PATCH /api/players/[id]`, `DELETE /api/players/[id]`
- `GET /jogadores`, `/jogadores/novo`, `/jogadores/[id]`, `/jogadores/[id]/editar`

## Próximos passos

1. Rodar `supabase/security.sql` no SQL Editor (fecha acesso anônimo).
2. Registrar um usuário real no app ou desativar confirmação de e-mail para dev.
3. Relatório do jogador — visão única (seção 8).
4. Sistema de compatibilidade (fit) (seção 9) e alertas inteligentes (seção 10).
5. Mercado BR: quando o tempo permitir, subir nome de clube para tabela própria (`clubes`) + escudos/fotos;
   aumentar volume e incluir ligas/mercados secundários no seed.