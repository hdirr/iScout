-- ============================================================
-- iScout — Cache acumulado do Transfermarkt (durabilidade)
-- Armazena o acúmulo local (scripts/data/cache-tm/ + tm-map.json)
-- no Supabase, para que nada se perca (a pasta cache-tm é
-- gitignored e vive só no disco da máquina de sync).
--
-- Chave primária (kind, chave) deixa o UPSERT do
-- scripts/persistir-cache.js idempotente / acumulativo:
-- rodar N vezes nunca duplica, apenas atualiza o payload.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================

create table if not exists public.tm_data_cache (
  kind          text not null,             -- 'perfil'|'desempenho'|'lesoes'|'search'|'mapa'|'relatorio'
  chave         text not null,             -- nome do arquivo, ex: 'perfil-123456.json'
  payload       jsonb not null,            -- conteúdo do arquivo
  atualizado_em timestamptz not null default now(),
  primary key (kind, chave)
);

alter table public.tm_data_cache enable row level security;

-- Política de dev aberta (mesma convenção das outras tabelas do schema).
create policy "tm_cache acesso dev"
  on public.tm_data_cache
  for all to anon, authenticated
  using (true)
  with check (true);