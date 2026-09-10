// Calcula avaliação do scout (nota 0-100 + recomendação) a partir dos stats
// reais da última temporada (season_stats) e grava em player_evaluations,
// atualizando também players.nota_global.
//
// Nota = média ponderada de PERCENTIS (entre os destaques da amostra) das
// métricas por 90 min, por grupo posicional. Distribui em 0-100 de forma
// discriminativa (o melhor do grupo = 100, a mediana ≈ 55-60).
//
// Roda OFFLINE (sem rede). Idempotente: apaga avaliações existentes e reinsere.
// Uso: node scripts/calcular-avaliacoes.js
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SCR = "Auto-scout";

function lerEnvLocal() {
  const p = path.join(__dirname, "..", ".env.local");
  const txt = fs.readFileSync(p, "utf8");
  const get = (k) => {
    const m = txt.match(new RegExp(`^${k}=(.*)$`, "m"));
    return m ? m[1].trim() : null;
  };
  return { url: get("NEXT_PUBLIC_SUPABASE_URL"), key: get("NEXT_PUBLIC_SUPABASE_ANON_KEY") };
}

function ordemPosicao(p) {
  const m = { GOL: 0, ZAG: 1, ZAE: 1, ZAD: 1, LAT: 1, LAE: 1, LAD: 1, VOL: 2, MC: 2, MED: 2, MEC: 2, MEI: 3, SA: 3, PON: 3, PEE: 3, PED: 3, CA: 4, CF: 4 };
  return m[p] ?? 2;
}

function idade(dataNasc) {
  if (!dataNasc) return null;
  const d = new Date(dataNasc);
  if (isNaN(d)) return null;
  const hoje = new Date();
  let i = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) i--;
  return i;
}

// métricas por 90 min usadas na nota, por grupo posicional (pesos somam 1)
function metricasPosicao(pos, t) {
  const min90 = (t.minutos_jogados || 0) / 90;
  const gol90 = min90 > 0 ? (t.gols_marcados || 0) / min90 : 0;
  const ast90 = min90 > 0 ? (t.assistencias || 0) / min90 : 0;
  const fin90 = min90 > 0 ? (t.finalizacoes || 0) / min90 : 0;
  const des90 = min90 > 0 ? (t.desarmes || 0) / min90 : 0;
  const passes90 = min90 > 0 ? (t.passes_tentados || 0) / min90 : 0;
  const prec = t.passes_tentados > 0 ? (t.passes_completos / t.passes_tentados) * 100 : 0;

  const g = ordemPosicao(pos);
  if (g === 0) return { m: [min90, prec, t.jogos_disputados || 0], w: [0.5, 0.3, 0.2], nomes: ["min90", "prec", "jogos"] };
  if (g === 1) return { m: [des90, passes90, min90], w: [0.4, 0.3, 0.3], nomes: ["des90", "passes90", "min90"] };
  if (g === 2) return { m: [gol90, ast90, des90, passes90], w: [0.3, 0.3, 0.2, 0.2], nomes: ["gol90", "ast90", "des90", "passes90"] };
  if (g === 3) return { m: [gol90, ast90, fin90, passes90], w: [0.35, 0.35, 0.15, 0.15], nomes: ["gol90", "ast90", "fin90", "passes90"] };
  return { m: [gol90, ast90, fin90], w: [0.6, 0.25, 0.15], nomes: ["gol90", "ast90", "fin90"] };
}

function pct(valor, ordenado) {
  if (!ordenado.length) return 0.5;
  let less = 0;
  let eq = 0;
  for (const v of ordenado) {
    if (v < valor) less++;
    else if (v === valor) eq++;
  }
  return (less + eq / 2) / ordenado.length;
}

function recomendacao(nota) {
  if (nota >= 75) return "Comprar imediatamente";
  if (nota >= 40) return "Monitorar";
  return "Descartar";
}

function potencialDesenvolvimento(nota, anos) {
  let bonus = 0;
  if (anos === null) bonus = 0;
  else if (anos < 21) bonus = 15;
  else if (anos <= 23) bonus = 10;
  else if (anos <= 26) bonus = 5;
  return Math.max(0, Math.min(100, Math.round(nota * 0.7 + bonus)));
}

function potencialMercado(valor, anos) {
  if (valor === null) return "Médio";
  if (valor >= 8_000_000 && (anos === null || anos <= 27)) return "Alto";
  if (valor >= 2_500_000) return "Médio";
  return "Baixo";
}

function tecnicaPos(pos, t) {
  const prec = Math.round(t.passes_tentados > 0 ? (t.passes_completos / t.passes_tentados) * 100 : 55);
  const gol90 = Math.round(Math.min(100, ((t.gols_marcados || 0) / Math.max(1, (t.minutos_jogados || 0) / 90)) * 33));
  const ast90 = Math.round(Math.min(100, ((t.assistencias || 0) / Math.max(1, (t.minutos_jogados || 0) / 90)) * 33));
  const base = { passe_curto: prec, controle_bola: 65, visao_jogo: 65, tomada_decisao: 65 };
  const g = ordemPosicao(pos);
  if (g >= 3) return { ...base, finalizacao: Math.round(55 + gol90), cabeca: 55, drible: 60 };
  if (g === 2) return { ...base, finalizacao: Math.round(40 + gol90), drible: 62, cruzamento: 58 };
  if (g === 1) return { ...base, desarme: 62, interceptacao: 60, posicionamento: 62 };
  return { ...base, lanca_tiro: 60, saida_bola: 58 };
}

function fisicaPos(pos) {
  const g = ordemPosicao(pos);
  if (g === 0) return { reflexo: 68, agilidade: 66, impulsao: 64 };
  if (g === 1) return { forca: 68, velocidade: 62, resistencia: 65 };
  if (g === 2) return { resistencia: 66, forca: 62, velocidade: 60 };
  return { velocidade: 66, agilidade: 64, finalizacao: 60 };
}

(async () => {
  const { url, key } = lerEnvLocal();
  if (!url || !key) {
    console.error("env local não encontrada (.env.local)");
    process.exit(1);
  }
  const sb = createClient(url, key);

  const { data: players, error } = await sb
    .from("players")
    .select("id,nome_completo,posicao_principal,data_nascimento,valor_mercado_estimado,nota_global,season_stats(*)");
  if (error) throw new Error(`Erro ao listar players: ${error.message}`);

  console.log(`Jogadores: ${players.length}`);

  // última temporada por jogador
  const ultima = players.map((p) => {
    const stats = (p.season_stats || []).slice().sort((a, b) => (a.temporada < b.temporada ? 1 : a.temporada > b.temporada ? -1 : 0));
    return { p, t: stats[0] || null };
  });

  // pré-computa distribuição de cada métrica (por grupo posicional)
  const dist = new Map();
  for (const { p, t } of ultima) {
    if (!t) continue;
    const g = ordemPosicao(p.posicao_principal);
    const mm = metricasPosicao(p.posicao_principal, t);
    if (!dist.has(g)) dist.set(g, mm.nomes.map(() => []));
    const buckets = dist.get(g);
    mm.m.forEach((v, i) => buckets[i].push(v));
  }
  for (const [g, buckets] of dist) { for (const b of buckets) b.sort((a, b) => a - b); }

  // apaga avaliações anteriores do sistema para re-inserir com idempotência
  const { error: delErr } = await sb.from("player_evaluations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) throw new Error(`Falha ao limpar avaliações: ${delErr.message}`);
  console.log("Avaliações anteriores removidas");

  let ok = 0;
  let semStats = 0;
  const hoje = new Date().toISOString().slice(0, 10);

  for (const { p, t } of ultima) {
    if (!t) {
      semStats++;
      continue;
    }
    const g = ordemPosicao(p.posicao_principal);
    const mm = metricasPosicao(p.posicao_principal, t);
    const buckets = dist.get(g);
    // shrink suaviza extremos: nenhuma nota fica ~0 nem ~100
    const nota = Math.round(100 * mm.m.reduce((s, v, i) => s + mm.w[i] * (0.92 * pct(v, buckets[i]) + 0.04), 0));
    const anos = idade(p.data_nascimento);
    const avaliacao = {
      player_id: p.id,
      tecnica: tecnicaPos(p.posicao_principal, t),
      fisica: fisicaPos(p.posicao_principal),
      comportamental: { lideranca: 60, disciplina: 65, relacionamento_grupo: 65 },
      observacoes_gerais: `Derivado automaticamente da temporada ${t.temporada} (${t.jogos_disputados} jogos, ${t.minutos_jogados} min).`,
      perfil_psicologico: null,
      potencial_de_mercado: potencialMercado(p.valor_mercado_estimado, anos),
      potencial_desenvolvimento: potencialDesenvolvimento(nota, anos),
      recomendacao_final: recomendacao(nota),
      scout_responsavel: SCR,
      data_avaliacao: hoje,
    };
    const { error: insErr } = await sb.from("player_evaluations").insert(avaliacao);
    if (insErr) {
      console.error(`Erro avaliação ${p.nome_completo}: ${insErr.message}`);
      continue;
    }
    const { error: updErr } = await sb.from("players").update({ nota_global: nota }).eq("id", p.id);
    if (updErr) console.error(`Erro nota ${p.nome_completo}: ${updErr.message}`);
    ok++;
  }

  const { count } = await sb.from("player_evaluations").select("id", { count: "exact", head: true });
  console.log(`Avaliações criadas: ${ok} (sem stats: ${semStats}) | total na tabela: ${count}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});