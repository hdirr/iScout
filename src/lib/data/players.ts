import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  Player,
  PlayerInput,
  PlayerInjury,
  PlayerInjuryInput,
  PlayerEvaluation,
  PlayerEvaluationInput,
  SeasonStats,
  SeasonStatsInput,
} from "@/lib/types";

type Db = SupabaseClient;

export interface PlayerListFilters {
  posicao?: Player["posicao_principal"];
  nacionalidade?: string;
  clube?: string;
  status?: Player["status_disponibilidade"];
  ordenarPor?: keyof Pick<Player, "nome_completo" | "nota_global" | "valor_mercado_estimado" | "clube_atual">;
  ordem?: "asc" | "desc";
  limite?: number;
}

export async function getPlayers(filters: PlayerListFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("players")
    .select("*")
    .order(filters.ordenarPor ?? "nome_completo", {
      ascending: (filters.ordem ?? "asc") === "asc",
    })
    .limit(filters.limite ?? 100);

  if (filters.posicao) query = query.eq("posicao_principal", filters.posicao);
  if (filters.nacionalidade) query = query.eq("nacionalidade", filters.nacionalidade);
  if (filters.clube) query = query.ilike("clube_atual", `%${filters.clube}%`);
  if (filters.status) query = query.eq("status_disponibilidade", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar jogadores: ${error.message}`);
  return data as Player[];
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