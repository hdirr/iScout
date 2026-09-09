import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { calcularIdade } from "@/lib/utils";
import type {
  GravidadeLesao,
  Pe,
  Posicao,
  Recomendacao,
  StatusDisponibilidade,
  TipoLesao,
  Player,
  PlayerInput,
  PlayerInjury,
  PlayerInjuryInput,
  PlayerEvaluation,
  PlayerEvaluationInput,
  PlayerWithStats,
  SeasonStats,
  SeasonStatsInput,
} from "@/lib/types";

type Db = SupabaseClient;

export type OrdenarJogadores =
  | "nome_completo"
  | "idade"
  | "posicao_principal"
  | "clube_atual"
  | "nota_global"
  | "valor_mercado_estimado";

// Filtros do dashboard (Seção 7 do documento central).
export interface PlayerFilters {
  busca?: string;
  posicao?: Posicao;
  pe?: Pe;
  nacionalidade?: string;
  clube?: string;
  liga?: string;
  pais?: string;
  status?: StatusDisponibilidade;
  idadeMin?: number;
  idadeMax?: number;
  alturaMin?: number;
  alturaMax?: number;
  pesoMin?: number;
  pesoMax?: number;
  fimContratoDe?: string;
  fimContratoAte?: string;
  valorMin?: number;
  valorMax?: number;
  // Desempenho (aplica-se à última temporada registrada)
  minJogos?: number;
  golsMin?: number;
  golsMax?: number;
  assistMin?: number;
  assistMax?: number;
  xgMin?: number;
  xgMax?: number;
  xaMin?: number;
  xaMax?: number;
  precisaoPassesMin?: number;
  precisaoPassesMax?: number;
  desarmesMin?: number;
  desarmesMax?: number;
  notaMin?: number;
  notaMax?: number;
  // Lesões
  maxDiasAfastado?: number;
  tipoLesao?: TipoLesao;
  gravidade?: GravidadeLesao;
  recidiva?: boolean;
  // Scout (aplica-se à última avaliação)
  avaliadoDe?: string;
  avaliadoAte?: string;
  scout?: string;
  recomendacao?: Recomendacao;
  potencialMin?: number;
  potencialMax?: number;
  ordenarPor?: OrdenarJogadores;
  ordem?: "asc" | "desc";
}

export interface PlayerSummary extends Player {
  season_stats: SeasonStats[];
  injuries: PlayerInjury[];
  evaluations: PlayerEvaluation[];
  ultima_temporada: SeasonStats | null;
  total_gols: number;
  total_assistencias: number;
  total_jogos: number;
  total_lesoes: number;
  max_dias_afastado: number;
  ultima_avaliacao: PlayerEvaluation | null;
}

const LIMITE_CARREGAMENTO = 1000;

// Formato retornado pelo PostgREST com os embeds (nome = nome da tabela).
type RawJogadorComRelacoes = Player & {
  season_stats: SeasonStats[] | null;
  player_injuries: PlayerInjury[] | null;
  player_evaluations: PlayerEvaluation[] | null;
};

export async function buscarJogadores(filters: PlayerFilters = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*, season_stats(*), player_injuries(*), player_evaluations(*)")
    .limit(LIMITE_CARREGAMENTO);

  if (error) {
    throw new Error(`Falha ao listar jogadores: ${error.message}`);
  }

  const resumos = ((data ?? []) as RawJogadorComRelacoes[]).map((raw) =>
    construirResumo({
      ...raw,
      season_stats: raw.season_stats ?? [],
      injuries: raw.player_injuries ?? [],
      evaluations: raw.player_evaluations ?? [],
    })
  );
  const filtrados = resumos.filter((j) => aplicaFiltros(j, filters));

  const { ordenarPor = "nome_completo", ordem = "asc" } = filters;
  filtrados.sort(compararPor(ordenarPor, ordem));

  return filtrados;
}

function construirResumo(jogador: PlayerWithStats): PlayerSummary {
  const temporadas = [...jogador.season_stats].sort((a, b) =>
    a.temporada < b.temporada ? 1 : a.temporada > b.temporada ? -1 : 0
  );
  const lesoes = jogador.injuries;
  const avaliacoes = [...jogador.evaluations].sort(compararAvaliacoes);

  const maxDias = lesoes.reduce(
    (max, l) => Math.max(max, l.dias_afastado ?? 0),
    0
  );

  return {
    ...jogador,
    season_stats: temporadas,
    injuries: lesoes,
    evaluations: avaliacoes,
    ultima_temporada: temporadas[0] ?? null,
    total_gols: temporadas.reduce((s, t) => s + t.gols_marcados, 0),
    total_assistencias: temporadas.reduce((s, t) => s + t.assistencias, 0),
    total_jogos: temporadas.reduce((s, t) => s + t.jogos_disputados, 0),
    total_lesoes: lesoes.length,
    max_dias_afastado: maxDias,
    ultima_avaliacao: avaliacoes[0] ?? null,
  };
}

function compararAvaliacoes(a: PlayerEvaluation, b: PlayerEvaluation) {
  const dataA = a.data_avaliacao ?? "";
  const dataB = b.data_avaliacao ?? "";
  if (dataA !== dataB) return dataA < dataB ? 1 : -1;
  return a.created_at < b.created_at ? 1 : -1;
}

function aplicaFiltros(j: PlayerSummary, f: PlayerFilters): boolean {
  // ---------- Jogador ----------
  if (f.busca) {
    const termo = f.busca.toLowerCase();
    const alvos = [j.nome_completo, j.nome_usual, j.apelido]
      .filter(Boolean)
      .map((v) => v!.toLowerCase());
    if (!alvos.some((v) => v.includes(termo))) return false;
  }
  if (f.posicao && j.posicao_principal !== f.posicao) return false;
  if (f.pe && j.pe_dominante !== f.pe) return false;
  if (f.nacionalidade && j.nacionalidade !== f.nacionalidade) return false;

  const idade = calcularIdade(j.data_nascimento);
  if (idade === null) {
    if (f.idadeMin !== undefined || f.idadeMax !== undefined) return false;
  } else {
    if (f.idadeMin !== undefined && idade < f.idadeMin) return false;
    if (f.idadeMax !== undefined && idade > f.idadeMax) return false;
  }
  if (!emRange(j.altura_cm, f.alturaMin, f.alturaMax)) return false;
  if (!emRange(j.peso_kg, f.pesoMin, f.pesoMax)) return false;

  // ---------- Clube ----------
  if (f.clube && !j.clube_atual?.toLowerCase().includes(f.clube.toLowerCase()))
    return false;
  if (f.liga && !j.liga_atual?.toLowerCase().includes(f.liga.toLowerCase()))
    return false;
  if (f.pais && j.pais_clube !== f.pais) return false;
  if (
    !dataEntre(j.data_fim_contrato, f.fimContratoDe, f.fimContratoAte)
  )
    return false;

  // ---------- Mercado ----------
  if (
    f.status &&
    j.status_disponibilidade &&
    j.status_disponibilidade !== f.status
  )
    return false;
  if (!emRange(j.valor_mercado_estimado, f.valorMin, f.valorMax)) return false;

  // ---------- Desempenho (última temporada) ----------
  const t = j.ultima_temporada;
  if (
    f.minJogos !== undefined ||
    f.golsMin !== undefined ||
    f.golsMax !== undefined ||
    f.assistMin !== undefined ||
    f.assistMax !== undefined ||
    f.xgMin !== undefined ||
    f.xgMax !== undefined ||
    f.xaMin !== undefined ||
    f.xaMax !== undefined ||
    f.precisaoPassesMin !== undefined ||
    f.precisaoPassesMax !== undefined ||
    f.desarmesMin !== undefined ||
    f.desarmesMax !== undefined
  ) {
    if (!t) return false;
    if (f.minJogos !== undefined && t.jogos_disputados < f.minJogos)
      return false;
    if (!emRange(t.gols_marcados, f.golsMin, f.golsMax)) return false;
    if (!emRange(t.assistencias, f.assistMin, f.assistMax)) return false;
    if (!emRange(t.xg, f.xgMin, f.xgMax)) return false;
    if (!emRange(t.xa, f.xaMin, f.xaMax)) return false;
    if (!emRange(t.desarmes, f.desarmesMin, f.desarmesMax)) return false;

    const precisaoPasses =
      t.passes_tentados > 0
        ? Math.round((t.passes_completos / t.passes_tentados) * 1000) / 10
        : null;
    if (
      (f.precisaoPassesMin !== undefined || f.precisaoPassesMax !== undefined) &&
      (precisaoPasses === null ||
        !emRange(precisaoPasses, f.precisaoPassesMin, f.precisaoPassesMax))
    )
      return false;
  }
  if (
    f.notaMin !== undefined ||
    f.notaMax !== undefined
  ) {
    if (j.nota_global === null || !emRange(j.nota_global, f.notaMin, f.notaMax))
      return false;
  }

  // ---------- Lesões ----------
  if (
    f.maxDiasAfastado !== undefined &&
    j.max_dias_afastado > f.maxDiasAfastado
  )
    return false;
  if (f.tipoLesao && !j.injuries.some((l) => l.tipo_lesao === f.tipoLesao))
    return false;
  if (f.gravidade && !j.injuries.some((l) => l.gravidade === f.gravidade))
    return false;
  if (f.recidiva !== undefined) {
    const temRecidiva = j.injuries.some((l) => l.recidiva);
    if (f.recidiva && !temRecidiva) return false;
    if (!f.recidiva && temRecidiva) return false;
  }

  // ---------- Scout (última avaliação) ----------
  const av = j.ultima_avaliacao;
  if (
    f.avaliadoDe !== undefined ||
    f.avaliadoAte !== undefined ||
    f.scout !== undefined ||
    f.recomendacao !== undefined ||
    f.potencialMin !== undefined ||
    f.potencialMax !== undefined
  ) {
    if (!av) return false;
    if (!dataEntre(av.data_avaliacao, f.avaliadoDe, f.avaliadoAte)) return false;
    if (
      f.scout &&
      !av.scout_responsavel?.toLowerCase().includes(f.scout.toLowerCase())
    )
      return false;
    if (f.recomendacao && av.recomendacao_final !== f.recomendacao)
      return false;
    if (
      (f.potencialMin !== undefined || f.potencialMax !== undefined) &&
      (av.potencial_desenvolvimento === null ||
        !emRange(
          av.potencial_desenvolvimento,
          f.potencialMin,
          f.potencialMax
        ))
    )
      return false;
  }

  return true;
}

function emRange(
  valor: number | null,
  min?: number,
  max?: number
): boolean {
  if (valor === null) return min === undefined && max === undefined;
  if (min !== undefined && valor < min) return false;
  if (max !== undefined && valor > max) return false;
  return true;
}

function dataEntre(
  valor: string | null,
  de?: string,
  ate?: string
): boolean {
  if (valor === null) return de === undefined && ate === undefined;
  if (de && valor < de) return false;
  if (ate && valor > ate) return false;
  return true;
}

function compararPor(campo: OrdenarJogadores, ordem: "asc" | "desc") {
  const sinal = ordem === "asc" ? 1 : -1;
  return (a: PlayerSummary, b: PlayerSummary) => {
    const va = extrairValor(a, campo);
    const vb = extrairValor(b, campo);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (va < vb) return -sinal;
    if (va > vb) return sinal;
    return 0;
  };
}

function extrairValor(
  j: PlayerSummary,
  campo: OrdenarJogadores
): string | number | null {
  switch (campo) {
    case "idade":
      return calcularIdade(j.data_nascimento);
    case "nome_completo":
      return j.nome_completo.toLowerCase();
    case "posicao_principal":
      return j.posicao_principal;
    case "clube_atual":
      return j.clube_atual?.toLowerCase() ?? null;
    case "nota_global":
      return j.nota_global;
    case "valor_mercado_estimado":
      return j.valor_mercado_estimado;
  }
}

export async function getPlayer(id: string) {
  const supabase = await createClient();

  const [{ data: player, error: playerError }, stats, injuries, evaluations] =
    await Promise.all([
      supabase.from("players").select("*").eq("id", id).single(),
      getPlayerSeasonStats(supabase, id),
      getPlayerInjuries(supabase, id),
      getPlayerEvaluations(supabase, id),
    ]);

  if (playerError) throw new Error(`Falha ao buscar jogador: ${playerError.message}`);
  if (!player) return null;

  return {
    ...(player as Player),
    season_stats: stats,
    injuries,
    evaluations,
  };
}

async function getPlayerSeasonStats(db: Db, playerId: string) {
  const { data, error } = await db
    .from("season_stats")
    .select("*")
    .eq("player_id", playerId)
    .order("temporada", { ascending: false });
  if (error) throw new Error(`Falha ao buscar estatísticas: ${error.message}`);
  return data as SeasonStats[];
}

async function getPlayerInjuries(db: Db, playerId: string) {
  const { data, error } = await db
    .from("player_injuries")
    .select("*")
    .eq("player_id", playerId)
    .order("data_inicio", { ascending: false });
  if (error) throw new Error(`Falha ao buscar lesões: ${error.message}`);
  return data as PlayerInjury[];
}

async function getPlayerEvaluations(db: Db, playerId: string) {
  const { data, error } = await db
    .from("player_evaluations")
    .select("*")
    .eq("player_id", playerId)
    .order("data_avaliacao", { ascending: false });
  if (error) throw new Error(`Falha ao buscar avaliações: ${error.message}`);
  return data as PlayerEvaluation[];
}

export async function createPlayer(input: PlayerInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Falha ao criar jogador: ${error.message}`);
  return data as Player;
}

export async function updatePlayer(id: string, input: Partial<PlayerInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Falha ao atualizar jogador: ${error.message}`);
  return data as Player;
}

export async function deletePlayer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir jogador: ${error.message}`);
}

export async function addSeasonStats(input: SeasonStatsInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("season_stats")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Falha ao salvar estatísticas: ${error.message}`);
  return data as SeasonStats;
}

export async function addInjury(input: PlayerInjuryInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_injuries")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Falha ao registrar lesão: ${error.message}`);
  return data as PlayerInjury;
}

export async function addEvaluation(input: PlayerEvaluationInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_evaluations")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Falha ao salvar avaliação: ${error.message}`);
  return data as PlayerEvaluation;
}