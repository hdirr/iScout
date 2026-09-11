import "server-only";

import type {
  PlayerInjury,
  PlayerEvaluation,
  PlayerWithStats,
  SeasonStats,
} from "@/lib/types";
import { calcularIdade } from "@/lib/utils";

export interface EixoRadar {
  rotulo: string;
  valor: number | null;
}

export interface TemporadaEvolucao {
  temporada: string;
  jogos: number;
  minutos: number;
  gols: number;
  assistencias: number;
  gols_por_90: number | null;
  assistencias_por_90: number | null;
  ga_por_90: number | null;
  precisao_passes: number | null;
}

export interface ItemAnalise {
  chave: string;
  rotulo: string;
  valor: number;
}

export interface AspectoAnalise {
  rotulo: string;
  media: number | null;
  itens: ItemAnalise[];
}

export interface Relatorio {
  geradoEm: string;
  resumo: {
    idade: number | null;
    nota: number | null;
    potencial: number | null;
    recomendacao: string | null;
    tem_avaliacao: boolean;
    risco_lesao: "Baixo" | "Médio" | "Alto";
    risco_detalhe: string;
    custo_beneficio: number | null;
    custo_beneficio_classe: "Alto" | "Médio" | "Baixo" | null;
  };
  radar: EixoRadar[];
  evolucao: TemporadaEvolucao[];
  analise: AspectoAnalise[];
  mercado: {
    valor_mercado: number | null;
    clausula: number | null;
    fim_contrato: string | null;
    potencial_de_mercado: string | null;
  };
  observacoes: string | null;
  sugestao_estrategica: string;
  total_lesoes: number;
  max_dias_afastado: number;
}

const ROTULO_CHAVE: Record<string, string> = {
  passe_curto: "Passe curto",
  passe_longo: "Passe longo",
  passe_decisivo: "Passe decisivo",
  cruzamento: "Cruzamento",
  finalizacao: "Finalização",
  drible: "Drible",
  controle_bola: "Controle de bola",
  recepcao: "Recepção",
  visao_jogo: "Visão de jogo",
  inteligencia_tatica: "Inteligência tática",
  cabeca: "Jogo aéreo",
  tomada_decisao: "Tomada de decisão",
  velocidade: "Velocidade",
  forca_fisica: "Força física",
  resistencia: "Resistência",
  agilidade: "Agilidade",
  impulsao: "Impulsão",
  equilibrio: "Equilíbrio",
  coordenacao: "Coordenação",
  lideranca: "Liderança",
  personalidade: "Personalidade",
  comprometimento: "Comprometimento",
  adaptabilidade: "Adaptabilidade",
  profissionalismo: "Profissionalismo",
  resiliencia: "Resiliência",
  disciplina_tatica: "Disciplina tática",
  relacionamento_grupo: "Relacionamento",
  disciplina: "Disciplina",
};

function mediaNumeros(obj: Record<string, unknown> | null | undefined): number | null {
  if (!obj) return null;
  const valores = Object.values(obj).filter((v): v is number => typeof v === "number");
  if (!valores.length) return null;
  return Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 10) / 10;
}

function por90(total: number, minutos: number): number | null {
  if (minutos <= 0) return null;
  return Math.round((total / minutos) * 900) / 10;
}

function rotuloDe(chave: string): string {
  return ROTULO_CHAVE[chave] ?? chave.replace(/_/g, " ");
}

function aspecto(jogador: PlayerWithStats, ultimaAvaliacao: PlayerEvaluation | null) {
  const aspectos: Array<{ rotulo: string; valores: Record<string, unknown> }> = [
    { rotulo: "Técnica", valores: ultimaAvaliacao?.tecnica ?? {} },
    { rotulo: "Física", valores: ultimaAvaliacao?.fisica ?? {} },
    { rotulo: "Comportamental", valores: ultimaAvaliacao?.comportamental ?? {} },
  ];
  return aspectos.map((a) => {
    const itens = Object.entries(a.valores)
      .filter((e): e is [string, number] => typeof e[1] === "number")
      .map(([chave, valor]) => ({ chave, rotulo: rotuloDe(chave), valor }));
    return { rotulo: a.rotulo, media: mediaNumeros(a.valores), itens };
  });
}

function riscoLesao(lesoes: PlayerInjury[]): { risco: "Baixo" | "Médio" | "Alto"; detalhe: string } {
  if (!lesoes.length) return { risco: "Baixo", detalhe: "Sem histórico de lesões registrado." };
  const maxDias = lesoes.reduce((m, l) => Math.max(m, l.dias_afastado ?? 0), 0);
  const muitoSevera = lesoes.some((l) => l.gravidade?.startsWith("Muito Severa"));
  const severa = lesoes.some((l) => l.gravidade?.startsWith("Severa"));
  const recidivas = lesoes.filter((l) => l.recidiva).length;
  if (maxDias >= 84 || muitoSevera || (severa && recidivas > 0)) {
    return { risco: "Alto", detalhe: `${lesoes.length} lesões; pior afastamento de ${maxDias} dias.` };
  }
  if (maxDias >= 29 || severa || recidivas > 0) {
    return { risco: "Médio", detalhe: `${lesoes.length} lesões; pior afastamento de ${maxDias} dias.` };
  }
  return { risco: "Baixo", detalhe: `${lesoes.length} lesões; afastamentos curtos.` };
}

function custoBeneficio(nota: number | null, valor: number | null) {
  if (nota === null || nota === undefined || !valor || valor <= 0) {
    return { numerico: null, classe: null as "Alto" | "Médio" | "Baixo" | null };
  }
  const porMilhao = nota / (valor / 1_000_000);
  const numerico = Math.round(porMilhao * 10) / 10;
  const classe: "Alto" | "Médio" | "Baixo" =
    porMilhao >= 20 ? "Alto" : porMilhao >= 12 ? "Médio" : "Baixo";
  return { numerico, classe };
}

function proximoDoFim(contrato: string | null): boolean {
  if (!contrato) return false;
  const fim = new Date(contrato);
  if (Number.isNaN(fim.getTime())) return false;
  const meses = (fim.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  return meses >= 0 && meses <= 12;
}

function sugerirEstrategia(
  rel: Pick<Relatorio["resumo"], "nota" | "potencial" | "recomendacao" | "risco_lesao" | "idade">,
  mercado: { valor_mercado: number | null; fim_contrato: string | null },
  temporadas: SeasonStats[]
): string {
  const partes: string[] = [];
  switch (rel.recomendacao) {
    case "Comprar imediatamente":
      partes.push("Perfil de contratação prioritária.");
      break;
    case "Monitorar":
      partes.push("Acompanhar de perto antes de decidir a investida.");
      break;
    case "Descartar":
      partes.push("Não recomendado para investimento no momento.");
      break;
    default:
      partes.push("Sem recomendação formal registrada.");
  }
  if (rel.idade !== null && rel.idade < 23) {
    partes.push(`Jovem (${rel.idade} anos) — encaixa em política de valorização de ativo.`);
  } else if (rel.idade !== null && rel.idade >= 30) {
    partes.push(`Já tem ${rel.idade} anos — janela de revenda limitada.`);
  }
  if (rel.potencial !== null && rel.potencial >= 75) {
    partes.push("Teto de desenvolvimento alto.");
  }
  if (rel.risco_lesao === "Alto") {
    partes.push("Histórico de lesões demanda exames médicos e plano de carga cuidadoso.");
  }
  if (mercado.valor_mercado === null) {
    partes.push("Sem referência de valor de mercado — negociação por estimativa.");
  } else if (rel.nota !== null && rel.nota >= 75 && mercado.valor_mercado < 5_000_000) {
    partes.push("Valor de mercado atrativo frente ao rendimento — oportunidade de mercado.");
  }
  if (proximoDoFim(mercado.fim_contrato)) {
    partes.push("Contrato próximo do fim — momento favorável para negociar.");
  }
  if (!temporadas.length) {
    partes.push("Sem estatísticas de temporada registradas nas últimas temporadas.");
  }
  return partes.join(" ");
}

export function montarRelatorio(jogador: PlayerWithStats): Relatorio {
  const avaliacoes = [...jogador.evaluations].sort((a, b) =>
    a.data_avaliacao && b.data_avaliacao && a.data_avaliacao < b.data_avaliacao ? 1 : -1
  );
  const ultimaAvaliacao = avaliacoes[0] ?? null;
  const temporadas = [...jogador.season_stats].sort((a, b) =>
    a.temporada < b.temporada ? -1 : a.temporada > b.temporada ? 1 : 0
  );

  const risco = riscoLesao(jogador.injuries);
  const cb = custoBeneficio(jogador.nota_global, jogador.valor_mercado_estimado);
  const idade = calcularIdade(jogador.data_nascimento);

  const radar: EixoRadar[] = [
    { rotulo: "Nota global", valor: jogador.nota_global },
    { rotulo: "Potencial", valor: ultimaAvaliacao?.potencial_desenvolvimento ?? null },
    { rotulo: "Técnica", valor: mediaNumeros(ultimaAvaliacao?.tecnica) },
    { rotulo: "Física", valor: mediaNumeros(ultimaAvaliacao?.fisica) },
    { rotulo: "Comportamental", valor: mediaNumeros(ultimaAvaliacao?.comportamental) },
  ];

  const evolucao: TemporadaEvolucao[] = temporadas.map((t) => {
    const g = t.gols_marcados ?? 0;
    const a = t.assistencias ?? 0;
    const minutos = t.minutos_jogados ?? 0;
    return {
      temporada: t.temporada,
      jogos: t.jogos_disputados ?? 0,
      minutos,
      gols: g,
      assistencias: a,
      gols_por_90: por90(g, minutos),
      assistencias_por_90: por90(a, minutos),
      ga_por_90: por90(g + a, minutos),
      precisao_passes:
        (t.passes_tentados ?? 0) > 0
          ? Math.round(((t.passes_completos ?? 0) / t.passes_tentados) * 1000) / 10
          : null,
    };
  });

  const analise = aspecto(jogador, ultimaAvaliacao);

  const maiorDias = jogador.injuries.reduce((m, l) => Math.max(m, l.dias_afastado ?? 0), 0);

  const resumo = {
    idade,
    nota: jogador.nota_global,
    potencial: ultimaAvaliacao?.potencial_desenvolvimento ?? null,
    recomendacao: ultimaAvaliacao?.recomendacao_final ?? null,
    tem_avaliacao: !!ultimaAvaliacao,
    risco_lesao: risco.risco,
    risco_detalhe: risco.detalhe,
    custo_beneficio: cb.numerico,
    custo_beneficio_classe: cb.classe,
  };

  return {
    geradoEm: new Date().toISOString(),
    resumo,
    radar,
    evolucao,
    analise,
    mercado: {
      valor_mercado: jogador.valor_mercado_estimado,
      clausula: jogador.clausula_rescisao,
      fim_contrato: jogador.data_fim_contrato,
      potencial_de_mercado: ultimaAvaliacao?.potencial_de_mercado ?? null,
    },
    observacoes: ultimaAvaliacao?.observacoes_gerais ?? null,
    sugestao_estrategica: sugerirEstrategia(
      resumo,
      { valor_mercado: jogador.valor_mercado_estimado, fim_contrato: jogador.data_fim_contrato },
      temporadas
    ),
    total_lesoes: jogador.injuries.length,
    max_dias_afastado: maiorDias,
  };
}