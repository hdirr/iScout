import type {
  Pe,
  Posicao,
  StatusDisponibilidade,
  TipoLesao,
  LocalizacaoLesao,
  LadoLesao,
  GravidadeLesao,
  CausaLesao,
} from "./enums";

export interface Player {
  id: string;
  nome_completo: string;
  nome_usual: string | null;
  apelido: string | null;
  data_nascimento: string | null;
  nacionalidade: string | null;
  segunda_nacionalidade: string | null;
  naturalidade: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  pe_dominante: Pe | null;
  posicao_principal: Posicao;
  posicoes_alternativas: Posicao[];
  clube_atual: string | null;
  liga_atual: string | null;
  pais_clube: string | null;
  data_inicio_contrato: string | null;
  data_fim_contrato: string | null;
  clausula_rescisao: number | null;
  valor_mercado_estimado: number | null;
  empresario: string | null;
  agencia: string | null;
  status_disponibilidade: StatusDisponibilidade;
  nota_global: number | null;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
}

export type PlayerInput = Omit<Player, "id" | "created_at" | "updated_at">;

// Métricas de posição (Seção 2.4) — varia conforme a posição (jsonb)
export interface MetricasGoleiro {
  defesas: number;
  defesas_por_jogo: number;
  gols_sofridos: number;
  media_gols_sofridos: number;
  clean_sheets: number;
  defesas_em_penalty: number;
  penalties_defendidos: number;
  saidas_goleiro: number;
  saidas_bem_sucedidas: number;
  distribuicao_com_pes: number;
  precisao_distribuicao_pes: number;
  distribuicao_com_maos: number;
  precisao_distribuicao_maos: number;
}

export interface MetricasDefensor {
  desarmes_corretos: number;
  desarmes_incorretos: number;
  interceptacoes_por_jogo: number;
  coberturas_defensivas: number;
  linhas_de_passe_quebradas: number;
  duelos_defensivos_ganhos: number;
  duelos_defensivos_perdidos: number;
  passes_de_saida: number;
  passes_de_saida_completos: number;
  construcao_de_jogo: number;
  bolas_progressivas: number;
  cruzamentos_defendidos: number;
}

export interface MetricasMeioCampo {
  passes_de_ruptura: number;
  passes_para_area: number;
  passes_progressivos: number;
  bolas_criadas: number;
  chances_criadas: number;
  chances_criadas_por_jogo: number;
  chaves_de_passe: number;
  passe_decisivo_por_jogo: number;
  conducao_progressiva: number;
  distancia_percorrida_km: number;
  sprint_velocidade_maxima_kmh: number;
  cobertura_defensiva: number;
  recuperacoes_posse: number;
  pressao_alta: number;
  toques_na_bola: number;
}

export interface MetricasAtacante {
  finalizacoes_por_jogo: number;
  chutes_por_gol: number;
  gols_esperados_por_finalizacao: number;
  big_chances_convertidas: number;
  big_chances_perdidas: number;
  finalizacoes_com_pe_esquerdo: number;
  finalizacoes_com_pe_direito: number;
  finalizacoes_cabeca: number;
  gols_fora_area: number;
  gols_contra_ataque: number;
  gols_de_bola_parada: number;
  dribles_por_jogo: number;
  dribles_sucesso: number;
  cruzamentos_por_jogo: number;
  precisao_cruzamentos: number;
  passes_decisivos_por_jogo: number;
}

// Métricas de intensidade e físico (Seção 2.5)
export interface MetricasIntensidade {
  distancia_percorrida_por_jogo_km: number;
  sprints_por_jogo: number;
  aceleracoes: number;
  deceleracoes: number;
  velocidade_maxima_kmh: number;
  velocidade_media_kmh: number;
  potencia_fisica: number;
  capacidade_aerobica: number;
  resistencia: number;
  explosao: number;
  agilidade: number;
  forca: number;
  carga_fisica_total: number;
  fadiga_acumulada: number;
  recuperacao_media: number;
}

export interface SeasonStats {
  id: string;
  player_id: string;
  temporada: string;
  clube: string | null;
  liga: string | null;
  jogos_disputados: number;
  jogos_titular: number;
  jogos_reserva_entrou: number;
  jogos_nao_relacionado: number;
  minutos_jogados: number;
  gols_marcados: number;
  assistencias: number;
  finalizacoes: number;
  finalizacoes_no_alvo: number;
  chutes_bloqueados: number;
  chutes_fora: number;
  xg: number | null;
  xa: number | null;
  passes_tentados: number;
  passes_completos: number;
  passes_chave: number;
  passes_para_finalizacao: number;
  passes_longos_tentados: number;
  passes_longos_completos: number;
  cruzamentos_tentados: number;
  cruzamentos_completos: number;
  dribles_tentados: number;
  dribles_completos: number;
  desarmes: number;
  interceptacoes: number;
  cortes: number;
  bloqueios: number;
  bolas_recuperadas: number;
  duelos_aereos_ganhos: number;
  duelos_aereos_perdidos: number;
  duelos_terra_ganhos: number;
  duelos_terra_perdidos: number;
  faltas_cometidas: number;
  faltas_sofridas: number;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
  penalties_convertidos: number;
  penalties_perdidos: number;
  gols_de_cabeca: number;
  gols_pe_esquerdo: number;
  gols_pe_direito: number;
  gols_fora_area: number;
  gols_dentro_area: number;
  finalizacoes_com_cabeca: number;
  metricas_posicao: Record<string, unknown>;
  intensidade_fisica: Partial<MetricasIntensidade>;
  created_at: string;
  updated_at: string;
}

export type SeasonStatsInput = Omit<SeasonStats, "id" | "created_at" | "updated_at">;

export interface PlayerInjury {
  id: string;
  player_id: string;
  data_inicio: string | null;
  data_previsao_retorno: string | null;
  data_retorno_efetivo: string | null;
  dias_afastado: number | null;
  jogos_perdidos: number | null;
  tipo_lesao: TipoLesao;
  localizacao: LocalizacaoLesao | null;
  lado: LadoLesao | null;
  gravidade: GravidadeLesao | null;
  causa: CausaLesao | null;
  recidiva: boolean;
  cirurgia_necessaria: boolean;
  cirurgia_realizada: boolean;
  medicacao: string | null;
  departamento_medico: string | null;
  tratamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type PlayerInjuryInput = Omit<PlayerInjury, "id" | "created_at" | "updated_at">;

export interface AvaliacaoTecnica {
  passe_curto: number;
  passe_longo: number;
  passe_decisivo: number;
  cruzamento: number;
  finalizacao: number;
  drible: number;
  controle_bola: number;
  recepcao: number;
  visao_jogo: number;
  inteligencia_tatica: number;
}

export interface AvaliacaoFisica {
  velocidade: number;
  forca_fisica: number;
  resistencia: number;
  agilidade: number;
  impulsao: number;
  equilibrio: number;
  coordenacao: number;
}

export interface AvaliacaoComportamental {
  lideranca: number;
  personalidade: number;
  comprometimento: number;
  adaptabilidade: number;
  profissionalismo: number;
  resiliencia: number;
  disciplina_tatica: number;
  relacionamento_grupo: number;
}

export interface PlayerEvaluation {
  id: string;
  player_id: string;
  tecnica: Partial<AvaliacaoTecnica>;
  fisica: Partial<AvaliacaoFisica>;
  comportamental: Partial<AvaliacaoComportamental>;
  observacoes_gerais: string | null;
  perfil_psicologico: string | null;
  potencial_de_mercado: "Alto" | "Médio" | "Baixo" | null;
  potencial_desenvolvimento: number | null;
  scout_responsavel: string | null;
  data_avaliacao: string | null;
  created_at: string;
  updated_at: string;
}

export type PlayerEvaluationInput = Omit<
  PlayerEvaluation,
  "id" | "created_at" | "updated_at"
>;

export interface PlayerWithStats extends Player {
  season_stats: SeasonStats[];
  injuries: PlayerInjury[];
  evaluations: PlayerEvaluation[];
}