-- =====================================================
-- iScout — Schema do Domínio de Jogadores
-- Reproduz as estruturas da Seção 2 do documento central
-- =====================================================

-- ---------- ENUNS ----------

create type public.foot as enum ('Destro', 'Canhoto', 'Ambidestro');
create type public.player_position as enum (
  'GOL', 'ZAG', 'ZAE', 'ZAD', 'LAT', 'LAE', 'LAD',
  'SA', 'CA', 'VOL', 'MC', 'MEC', 'MED', 'MEI',
  'PON', 'PEE', 'PED', 'CF'
);
create type public.availability_status as enum (
  'Disponível', 'Em negociação', 'Acertado com outro clube', 'Indisponível'
);
create type public.injury_type as enum (
  'Muscular', 'Ligamento', 'Osso', 'Tendão', 'Cartilagem',
  'Concussão', 'Cirurgia', 'Outro'
);
create type public.injury_location as enum (
  'Coxa', 'Panturrilha', 'Joelho', 'Tornozelo', 'Pé',
  'Quadril', 'Virilha', 'Costas', 'Ombro', 'Mão/Braço', 'Cabeça'
);
create type public.injury_side as enum ('Esquerdo', 'Direito', 'Ambos');
create type public.injury_severity as enum (
  'Pequena (<7 dias)', 'Moderada (7-28 dias)',
  'Severa (28-84 dias)', 'Muito Severa (>84 dias)'
);
create type public.injury_cause as enum (
  'Contato', 'Muscular sem contato', 'Sobrecarga', 'Recidiva', 'Acidente de treino'
);
create type public.injury_risk as enum (
  'Baixo risco', 'Médio risco', 'Alto risco', 'Muito alto risco'
);

-- ---------- FUNCTIONS E TRIGGERS ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- TABELA: players ----------

create table public.players (
  id              uuid primary key default gen_random_uuid(),
  nome_completo   text not null,
  nome_usual      text,
  apelido         text,

  data_nascimento date,
  nacionalidade   text,
  segunda_nacionalidade text,
  naturalidade    text,

  altura_cm       numeric,
  peso_kg         numeric,
  pe_dominante    public.foot,
  posicao_principal public.player_position not null,
  posicoes_alternativas public.player_position[] default '{}',

  clube_atual     text,
  liga_atual      text,
  pais_clube      text,

  data_inicio_contrato date,
  data_fim_contrato    date,
  clausula_rescisao    numeric, -- €
  valor_mercado_estimado numeric, -- €
  empresario           text,
  agencia              text,
  status_disponibilidade public.availability_status not null default 'Disponível',

  nota_global  numeric, -- 0-100 (agregado, recalculado)
  foto_url     text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index players_posicao_idx        on public.players (posicao_principal);
create index players_valor_mercado_idx  on public.players (valor_mercado_estimado);
create index players_nome_idx           on public.players (nome_completo);

create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

-- ---------- TABELA: season_stats ----------
-- Estatísticas básicas por temporada (Seção 2.3).
-- Métricas específicas por posição (2.4) e de intensidade (2.5)
-- ficam em jsonb por serem heterogêneas entre posições.

create table public.season_stats (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references public.players (id) on delete cascade,
  temporada     text not null, -- ex: '2025/2026'
  clube         text,
  liga          text,

  -- 2.3.1 Jogos e minutos
  jogos_disputados        integer not null default 0,
  jogos_titular           integer not null default 0,
  jogos_reserva_entrou    integer not null default 0,
  jogos_nao_relacionado   integer not null default 0,
  minutos_jogados         integer not null default 0,

  -- 2.3.2 Contribuição ofensiva
  gols_marcados        integer not null default 0,
  assistencias         integer not null default 0,
  finalizacoes         integer not null default 0,
  finalizacoes_no_alvo integer not null default 0,
  chutes_bloqueados    integer not null default 0,
  chutes_fora          integer not null default 0,
  xg                   numeric, -- gols esperados
  xa                   numeric, -- assistências esperadas

  -- 2.3.3 Passes e construção
  passes_tentados          integer not null default 0,
  passes_completos         integer not null default 0,
  passes_chave             integer not null default 0,
  passes_para_finalizacao  integer not null default 0,
  passes_longos_tentados   integer not null default 0,
  passes_longos_completos  integer not null default 0,
  cruzamentos_tentados     integer not null default 0,
  cruzamentos_completos    integer not null default 0,

  -- 2.3.4 Dribles e duelos
  dribles_tentados       integer not null default 0,
  dribles_completos      integer not null default 0,
  desarmes               integer not null default 0,
  interceptacoes         integer not null default 0,
  cortes                 integer not null default 0,
  bloqueios              integer not null default 0,
  bolas_recuperadas      integer not null default 0,
  duelos_aereos_ganhos   integer not null default 0,
  duelos_aereos_perdidos integer not null default 0,
  duelos_terra_ganhos    integer not null default 0,
  duelos_terra_perdidos  integer not null default 0,

  -- 2.3.5 Disciplina e finalização
  faltas_cometidas       integer not null default 0,
  faltas_sofridas        integer not null default 0,
  cartoes_amarelos       integer not null default 0,
  cartoes_vermelhos      integer not null default 0,
  penalties_convertidos  integer not null default 0,
  penalties_perdidos     integer not null default 0,
  gols_de_cabeca         integer not null default 0,
  gols_pe_esquerdo       integer not null default 0,
  gols_pe_direito        integer not null default 0,
  gols_fora_area         integer not null default 0,
  gols_dentro_area       integer not null default 0,
  finalizacoes_com_cabeca integer not null default 0,

  -- Métricas específicas por posição (Seção 2.4) — estrutura varia por posição
  metricas_posicao jsonb not null default '{}',

  -- Métricas de intensidade e físico (Seção 2.5)
  intensidade_fisica jsonb not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, temporada)
);

create index season_stats_player_idx on public.season_stats (player_id);
create index season_stats_temporada_idx on public.season_stats (temporada);

create trigger season_stats_set_updated_at
  before update on public.season_stats
  for each row execute function public.set_updated_at();

-- ---------- TABELA: player_injuries ----------

create table public.player_injuries (
  id                    uuid primary key default gen_random_uuid(),
  player_id             uuid not null references public.players (id) on delete cascade,

  data_inicio           date,
  data_previsao_retorno date,
  data_retorno_efetivo  date,
  dias_afastado         integer,
  jogos_perdidos        integer,

  tipo_lesao    public.injury_type not null,
  localizacao   public.injury_location,
  lado          public.injury_side,
  gravidade     public.injury_severity,
  causa         public.injury_cause,
  recidiva      boolean not null default false,

  cirurgia_necessaria boolean not null default false,
  cirurgia_realizada  boolean not null default false,
  medicacao           text,
  departamento_medico text,
  tratamento          text,
  observacoes         text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index player_injuries_player_idx on public.player_injuries (player_id);

create trigger player_injuries_set_updated_at
  before update on public.player_injuries
  for each row execute function public.set_updated_at();

-- ---------- TABELA: player_evaluations ----------
-- Avaliação qualitativa do scout (Seção 4 do documento central).

create table public.player_evaluations (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references public.players (id) on delete cascade,

  tecnica       jsonb not null default '{}', -- passe_curto..inteligencia_tatica
  fisica        jsonb not null default '{}', -- velocidade..coordenacao
  comportamental jsonb not null default '{}', -- lideranca..relacionamento_grupo

  observacoes_gerais       text,
  perfil_psicologico       text,
  potencial_de_mercado     text, -- Alto | Médio | Baixo
  potencial_desenvolvimento numeric, -- 0-100

  scout_responsavel text,
  data_avaliacao    date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index player_evaluations_player_idx on public.player_evaluations (player_id);

create trigger player_evaluations_set_updated_at
  before update on public.player_evaluations
  for each row execute function public.set_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
-- ATENÇÃO: por enquanto anon e authenticated têm acesso de leitura/escrita
-- para desenvolvimento. Quando o módulo de autenticação (e multi-clube)
-- for implementado, estas policies serão substituídas por filtro por
-- clube/usuario.

alter table public.players            enable row level security;
alter table public.season_stats       enable row level security;
alter table public.player_injuries    enable row level security;
alter table public.player_evaluations enable row level security;

create policy "players acesso dev"
  on public.players for all to anon, authenticated using (true) with check (true);
create policy "stats acesso dev"
  on public.season_stats for all to anon, authenticated using (true) with check (true);
create policy "lesoes acesso dev"
  on public.player_injuries for all to anon, authenticated using (true) with check (true);
create policy "avaliacoes acesso dev"
  on public.player_evaluations for all to anon, authenticated using (true) with check (true);