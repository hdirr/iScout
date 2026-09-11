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
| **Dados reais via Transfermarkt** | **380/400** — faltam 8 sem match; re-run via `sincronizar-tm.js` quando o anti-bot liberar |
| Dashboard com busca simplificada (seção 7 doc) | ok — busca por jogador ou time em `/jogadores` |
| **Relatório do jogador — visão única (seção 8)** | **ok** — radar SVG + evolução + análise detalhada + lesões + mercado + pontos de atenção em `/jogadores/[id]`, com botão Imprimir |

## Milestone Transfermarkt (dados reais, custo zero)

Objetivo: substituir stats fake do seed por **dados reais do Transfermarkt via wrapper Node**, 3
temporadas (2024/2025/2026), começando pelos destaques (10/clube) das Séries A/B.

- **Blocker de DDL resolvido**: não há coluna `tm_id`. Usa-se **UUID v5 determinístico** a partir do
  tm_id (`uuidV5(NAMESPACE='f3f0b2a4-…-9d01', 'transfermarkt:{tmId}')`). RLS permite INSERT/UPDATE/DELETE
  pela anon key (só DDL é bloqueado). `schema-v2.sql` **não é mais necessário**.
- **Endpoints TM validados**:
  - Busca: `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=…` → HTML com âncoras
    `href="…/profil/spieler/{id}"`. **Bloqueada por anti-bot (HTTP 405 "Human Verification") em batch longo.**
  - Perfil: `https://www.transfermarkt.com/{slug}/profil/spieler/{id}` (a URL curta `/profil/spieler/{id}`
    responde **404**). Meta description traz valor de mercado, nascimento, clube, posição.
  - Stats: `https://www.transfermarkt.com/ceapi/performance-game/{id}` → JSON por jogo. As páginas
    `leistungsdaten` viraram web components (tabela server-rendered não existe mais).
- **Scripts**:
  - `scripts/lib/transfermarkt-client.js`: client TM (busca/perfil/desempenho/**lesões**, cache,
    throttle ~2,5 s, retries, e `buscaJogador` retorna `{cands, bloqueado}` — **não cacheia vazio
    quando bloqueado**). Helpers offline: `getPerfilCache(id)` / `getDesempenhoCache(id)` /
    `getLesoesCache(id)`.
  - `scripts/puxar-transfermarkt.js`: pipeline (UUID v5, purge total, upsert players/season_stats/
    **player_injuries**, relatório). Suporta `OFFLINE=1` (usa mapa + cache, sem rede), `PILOT=<roster>`,
    `LIMITE=<n>`. Deduplica por `tm_id`. `resolverJogador` aceita score ≥ 1 e tenta nome
    completo/apelido; com `OFFLINE` consome `scripts/data/tm-map.json`.
  - `scripts/extrair-mapa.js`: reconstrói `tm-map.json` (clube|nome|apelido → TM id) a partir do log
    da run 1, para inserir offline os jogadores já cacheados.
  - `scripts/calcular-avaliacoes.js`: **avaliação derivada dos stats reais** (roda offline).
    Nota 0-100 = média ponderada de **percentis** (entre os destaques da amostra) de métricas por 90
    min, por grupo posicional (GOL: min/precisão/jogos; DEF: desarmes/passes/min; MID: gols+assist/
    desarmes/passes; MEI: gols+assist/finalizações/passes; ATT: gols/assist/finaizações) com shrink
    0.92+0.04. Preenche `tecnica`/`fisica`/`comportamental`, `potencial_*`,
    `scout_responsavel="Auto-scout"` e atualiza `players.nota_global`. **Não emite recomendação**
    (a ferramenta só auxilia — quem decide é o scout/técnico). **Idempotente** (apaga avaliações e
    reinsere). `node scripts/calcular-avaliacoes.js`.
  - `scripts/sincronizar-tm.js`: **agendador de re-run**. Sonda a busca TM a cada
    `TM_PROBE_INTERVAL_MS` (default 10 min, margem sobre throttle); quando o anti-bot liberar, roda o
    puxar em modo rede até o fim (com lesões), grava `sync-*.log` e `SYNC_OK.json` e encerra.
    `--uma-vez` para sonda única. **Rodar no terminal do usuário** (processos destacados a partir do
    ambiente do assistente são terminados pelo executor). Em background no Windows:
    `Start-Process -FilePath node -ArgumentList 'scripts\sincronizar-tm.js' -WindowStyle Hidden`.
    **Lock anti-sobreposição**: se um sync já estiver rodando (`SYNC_RUNNING.lock` em cache-tm), o
    watcher registra e não inicia outro.
  - `scripts/data/cache-tm/` **ignorado no git** (`.gitignore` em `scripts/`).
- **Sincronização atual**: **355/400** jogadores reais inseridos, com **906 `season_stats`** e
  **1302 `player_injuries`**, 0 erros (sync rede completo em `sync-full-4.log`, 10/09 15:56Z).
  Faltam **45** "sem match" (34 no relatório; maioria pegou bloqueio do TM no fim da run — Vasco/Vila
  Nova/Vitória). O anti-bot do TM é **intermitente por IP** (HTTP 405 "Human Verification"; bloqueia
  por 1–3 min, libera, re-bloqueia) — quando bloqueado, até perfil/ceapi/lesões param de responder.
- **Cooldown global (novo)**: `resolverJogador` não retenta mais in-place (retry 12→51s por query
  devorava horas). Bloqueio → `{bloqueado:true}`; o loop principal conta 3 bloqueios consecutivos e
  dorme `TM_COOLDOWN_MS` (default 5 min), depois retoma. Foi o que deixou a run de 2h chegar ao fim.
- **Pipeline em 2 fases (cache desacopla rede do banco)**: (1) **rede → cache** — o `puxar` baixa e
  salva em `cache-tm/` (perfil-*, desempenho-*, lesoes-*, search-*) e **grava `tm-map.json`
  incrementalmente a cada clube** (mesmo morto no meio, o mapa fica atualizado); (2) **cache →
  Supabase** — `OFFLINE=1 node scripts/puxar-transfermarkt.js` popular o banco inteiramente a partir
  do cache, sem tocar a rede (seguro contra bloqueio/timeout; idempotente: purge total). Sem isso, uma
  run cortada no meio perdia a gravação. `scripts/extrair-mapa.js [logs...]` reconstrói/mescla o mapa
  a partir dos logs de resolução.
- **Avaliações derivadas**: **333** avaliações geradas (`Auto-scout`, 47 sem season_stats → `nota_global`
  null). Top: Neymar 92 (Santos), Gabriel 91 (Vitória), Arrascaeta 90.
- **Lesões**: parse pronto e **populado** (1302 registros). Tipo/localização/gravidade/causa por
  keyword do texto TM, recidiva por repetição, cirurgia se "surgery/operation".
- **Contacts reality check**: dados realistas confirmados — Pedro 2026 = 33 jogos/1053 min/5 gols
  (retorno de lesão), Pulgar 2026 = 1 vermelho, Arrascaeta 2025 = 23 gols/18 assist, valori: Ortiz
  €12M, Rossi €10M.
- **Como completar os 8 restantes**: rodar `node scripts/sincronizar-tm.js` (watcher — espera o
  TM liberar e roda o sync sozinho, com o lock anti-overlap) ou, quando o TM liberar,
  `node scripts/puxar-transfermarkt.js` (372 já saem do cache; só os pendentes tocam a rede)
  e depois `node scripts/calcular-avaliacoes.js`. Re-run é seguro: purge total + idempotente. Nomes
  estrangeiros (S. Rodríguez, Matías Segovia, Sebastián Gómez, etc.) precisam de busca manual.

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
  - Scout (scout, potencial, data) aplicado à **última avaliação** (por `data_avaliacao`).
  - Precisão de passes = `passes_completos/passes_tentados * 100` na última temporada.
- **UI** (request do usuário: "busca simples por time ou jogador, métricas importantes, ferramenta fácil"):
  `src/components/jogadores-filtros.tsx` é um form compacto com **campo único de busca** (jogador OU time),
  seletores-chave (Posição, Disponibilidade), ordenação (Nome/Idade/Posição/Clube/
  Nota/Valor + direção) e botões Buscar/Limpar. A tabela mostra: Jogador (**com foto** do TM),
  Posição, Clube/Liga, Temporada (jogos), Gols · Assist, Dias afastado, Valor, Nota e Status.
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

## Relatório do jogador (seção 8 — visão única)

- `src/lib/reporte.ts`: `montarRelatorio(jogador)` deriva tudo do que `getPlayer` já traz (sem query
  extra/DDL): resumo executivo (nota, potencial, risco de lesão → Baixo/Médio/Alto), radar 5 eixos
  (média das chaves de cada jsonb da avaliação),
  evolução por temporada (gols/assist/min/jogos, G+A/90, % passes), análise detalhada
  (técnica/física/comportamental — rótulos amigáveis por chave), mercado (valor, cláusula, fim de
  contrato, potencial de mercado) e pontos de atenção em texto (fatos, sem prescrição).
- `src/components/jogador-relatorio.tsx`: Server Component, **SVG inline** (sem lib de chart) — radar
  pentagonal + barras gols/assist por temporada. Estados vazios para jogadores sem avaliação/stats
  (os 47 sem season_stats). `src/components/imprimir-relatorio.tsx`: botão Imprimir (`window.print`),
  layout com `print:hidden` nos controles e cabeçalho próprio no print.
- `/jogadores/[id]` passou a renderizar o relatório completo (Editar/Excluir mantidos).

## Empacotamento — acúmulo durável no Supabase

- **Problema resolvido**: o acúmulo do TM (cache ~1400 arquivos/1,5 MB) vivia só no disco local e é
  gitignored — se a máquina se perdesse, o OFFLINE ficava cego. Agora tudo é persistido no Supabase
  na tabela `public.tm_data_cache` (kind+chave PK, payload jsonb, RLS "acesso dev").
- **DDL** (`supabase/tm_cache.sql`, rodado no SQL Editor — anon key não tem permissão de DDL):
  `tm_data_cache(kind, chave, payload, atualizado_em)`. UPSERT por `(kind,chave)` = idempotente/
  acumulativo (rodar N vezes nunca duplica).
- **`scripts/persistir-cache.js`**: sobe `perfil-*/desempenho-*/lesoes-*/search-*` + `tm-map.json` +
  `ultima-sync.json` em lotes de 100. `--somente-map` = só mapa+relatório (backup rápido).
- **`scripts/restaurar-cache.js`**: baixa tudo e reconstrói o arquivos locais (recuperação em outra
  máquina). Round-trip validado (amostra 15/15 idêntica).
- **Auto-avaliação no puxar**: a purge cascade apaga `player_evaluations`, então o `puxar` agora
  invoca `scripts/calcular-avaliacoes.js` no fim de todo sync que grava (try/catch; avisa se falhar).
- **Watcher**: `sincronizar-tm.js` após sync com exit 0 roda `persistir-cache.js` automaticamente.
- **Estado atual**: backup completo rodado — **1404 artefatos** no Supabase (perfil 381, desempenho
  381, lesoes 381, search 259, mapa, relatório), 0 erros.

## Foco no jogador — a ferramenta não decide (milestone 1/3)

- **Decisão do usuário**: "quero só a ferramenta de auxílio, ela não toma decisão — quem decide é o
  scout/técnico." Removidos os rótulos prescritivos; métricas (nota, eixos, risco lesão, mercado)
  permanecem como auxílio.
- **Removidas** (código + seed):
  - **Recomendação**: `recomendacao_final` saiu do `calcular-avaliacoes.js`, `seed-brasileirao-2026.js`,
    types (`Recomendacao`/`RECOMENDACAO`), filtro `recomendacao` no data layer, coluna + dropdown da
    lista, badge da ficha. `sugerirEstrategia` → **`pontos_atencao`** (só fatos: idade, risco lesão, valor
    baixo, contrato próximo do fim, sem stats — sem "comprar/monitorar/descartar").
  - **Custo-benefício** (card da ficha): `custoBeneficio()` e campos `custo_beneficio*` removidos.
  - Resumo executivo agora: Nota, Potencial, Idade, Risco de lesão.
- **Fotos**: avatar circular com `foto_url` do TM na lista `/jogadores` (379/380 têm).
- **Avaliações re-derivadas** com o novo cálculo (333; 47 sem stats). Rótulos antigos zerados.
- **Migração pendente (SQL Editor — usuário roda)**:
  ```sql
  alter table public.player_evaluations drop column if exists recomendacao_final;
  drop type if exists public.recommendation;
  ```
  `schema.sql` já está limpo (setup novo nasce sem a coluna/enum).
- **Parcelas seguintes** (já aprovadas): **B** — expor filtros que o backend já tem (idade, valor, nota,
  pé, clube/liga); **C** — comparador de 2–3 jogadores `/comparar` (radar + stats lado a lado).

## Próximos passos

1. **Rodar a migração pós-remoção** (SQL Editor): `drop column recomendacao_final` + `drop type
   recommendation` (ver seção "Foco no jogador").
2. **Completar os 8 dados reais TM restantes** (sem match por vizinhos de nome — S. Rodríguez,
   Matías Segovia, Sebastián Gómez, etc.): revisar busca manual com apelidos alternativos quando o TM
   liberar, ou aceitar como fora da amostra. Watcher: `node scripts/sincronizar-tm.js` no terminal do
   usuário.
3. **Re-rodar avaliações após qualquer sync**: `node scripts/calcular-avaliacoes.js` (agora é feita
   automaticamente pelo próprio puxar ao final de cada sync que grava).
4. **Filtros ricos na busca (parcela B)**: expor no form o que `buscarJogadores` já filtra — idade
   min/max, valor min/max, nota min/max, pé, clube/liga.
5. **Comparador de jogadores (parcela C)**: `/comparar` com seleção de 2–3 jogadores, radar e stats
   lado a lado.
6. **Sistema de compatibilidade (fit)** (seção 9): form (estilo de jogo, sistema tático, prioridades,
   orçamento, necessidade) + score derivado dos percentis/avaliação; sem tabela nova.
7. **Alertas inteligentes** (seção 10): painel computado on the fly (contrato perto do fim, lesão
   recorrente, desempenho em alta/queda, jovem talento, oportunidade de mercado).
8. Rodar `supabase/security.sql` no SQL Editor (fecha acesso anônimo) — **após o fim da demo**.
9. Registrar um usuário real no app ou desativar confirmação de e-mail para dev.
10. Mercado BR: subir nome de clube para tabela própria (`clubes`) + escudos/fotos; aumentar volume e
    incluir ligas/mercados secundários.