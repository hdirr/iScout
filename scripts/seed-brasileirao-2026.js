// ============================================================
// iScout — Seed do Mercado Brasileiro (Séries A e B) 2026
// Lê scripts/data/rosters/*.json (elencos reais pesquisados),
// gera stats/lesões/avaliações plausíveis e insere no Supabase.
// Uso: node scripts/seed-brasileirao-2026.js
// Obs.: apaga TODOS os players existentes antes de inserir.
// ============================================================
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// ---------- env ----------
function lerEnvLocal() {
  const p = path.join(__dirname, "..", ".env.local");
  const txt = fs.readFileSync(p, "utf8");
  const get = (k) => {
    const m = txt.match(new RegExp(`^${k}=(.*)$`, "m"));
    return m ? m[1].trim() : null;
  };
  return { url: get("NEXT_PUBLIC_SUPABASE_URL"), key: get("NEXT_PUBLIC_SUPABASE_ANON_KEY") };
}

// ---------- PRNG determinístico ----------
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- helpers ----------
const ELITE_A = new Set([
  "Flamengo", "Palmeiras", "Corinthians", "São Paulo", "Botafogo",
  "Atlético-MG", "Grêmio", "Internacional", "Fluminense", "Cruzeiro",
  "Vasco da Gama", "Santos",
]);

const DEF = new Set(["ZAG", "ZAE", "ZAD", "LAT", "LAE", "LAD"]);
const MID_DEF = new Set(["VOL", "MC", "MED", "MEC"]);
const MID_OFF = new Set(["MEI", "SA"]);
const WING = new Set(["PON", "PEE", "PED"]);
const ATT = new Set(["CA", "CF"]);

const POS_MULT = {
  GOL: 0.55, ZAG: 0.7, ZAE: 0.7, ZAD: 0.7, LAT: 0.75, LAE: 0.75, LAD: 0.75,
  VOL: 0.95, MC: 1.0, MED: 1.0, MEC: 1.0,
  MEI: 1.15, SA: 1.15, PON: 1.15, PEE: 1.15, PED: 1.15, CA: 1.35, CF: 1.3,
};

const SCOUTS = ["Agadir", "Maria Rodas", "Rafael Senna"];

function rint(rnd, min, max) {
  return Math.floor(rnd() * (max - min + 1)) + min;
}
function pick(rnd, arr) {
  return arr[Math.floor(rnd() * arr.length)];
}
function choice(rnd, weighted) {
  let r = rnd();
  for (const [k, p] of weighted) {
    if (r <= p) return k;
    r -= p;
  }
  return weighted[weighted.length - 1][0];
}
function chance(rnd, p) {
  return rnd() < p;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function idade(dataNasc, ref = "2026-09-09") {
  const a = new Date(dataNasc + "T12:00:00");
  const b = new Date(ref + "T12:00:00");
  return Math.floor((b - a) / (365.25 * 24 * 3600 * 1000));
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function round50k(v) {
  return Math.round(v / 50000) * 50000;
}

// ---------- geradores ----------
function gerarValor(j, rnd) {
  const divA = j.divisao === "A";
  const elite = divA && ELITE_A.has(j.clube);
  const idadeJ = idade(j.data_nascimento);
  const fatorIdade =
    idadeJ <= 21 ? 0.6 : idadeJ <= 26 ? 1.0 : idadeJ <= 30 ? 0.75 : idadeJ <= 34 ? 0.45 : 0.3;
  const base =
    divA === false ? rint(rnd, 250, 400) * 1000
    : elite ? rint(rnd, 2200, 7000) * 1000
    : rint(rnd, 700, 2200) * 1000;
  const val = base * (POS_MULT[j.posicao_principal] ?? 1) * fatorIdade;
  return { valor: round50k(val), fatorIdade };
}

function gerarNota(j, rnd) {
  const divA = j.divisao === "A";
  const elite = divA && ELITE_A.has(j.clube);
  const lo = divA === false ? 54 : elite ? 66 : 58;
  const hi = divA === false ? 76 : elite ? 90 : 82;
  const n = rint(rnd, lo, hi);
  return n + (j.posicao_principal === "GOL" ? -2 : j.posicao_principal === "CA" || j.posicao_principal === "MEI" ? 2 : 0);
}

function gerarStats(j, rnd) {
  const pos = j.posicao_principal;
  const jogos = rint(rnd, 18, 38);
  const titular = rint(rnd, Math.max(12, jogos - 6), jogos);
  const minutosPorJogo = rint(rnd, 72, 92);
  const passesAcc = 0.8 + rnd() * 0.13;

  const base = {
    temporada: "2025/2026",
    clube: j.clube,
    liga: j.liga,
    jogos_disputados: jogos,
    jogos_titular: titular,
    jogos_reserva_entrou: Math.max(0, jogos - titular),
    jogos_nao_relacionado: rint(rnd, 0, 5),
    minutos_jogados: jogos * minutosPorJogo,
    passes_tentados: 0,
    passes_completos: 0,
    passes_chave: 0,
    passes_longos_tentados: 0,
    passes_longos_completos: 0,
    desarmes: 0,
    interceptacoes: 0,
    cortes: 0,
    bolas_recuperadas: 0,
    duelos_aereos_ganhos: 0,
    duelos_aereos_perdidos: 0,
    faltas_cometidas: rint(rnd, 10, 45),
    faltas_sofridas: rint(rnd, 10, 40),
    cartoes_amarelos: rint(rnd, 0, 9),
    cartoes_vermelhos: chance(rnd, 0.12) ? 1 : 0,
    penalties_convertidos: 0,
    penalties_perdidos: 0,
    xg: 0,
    xa: 0,
    metricas_posicao: {},
    intensidade_fisica: {},
  };

  const setPasses = (minP, maxP) => {
    base.passes_tentados = rint(rnd, minP, maxP);
    base.passes_completos = Math.round(base.passes_tentados * passesAcc);
  };

  if (pos === "GOL") {
    setPasses(450, 850);
    base.passes_longos_tentados = rint(rnd, 120, 260);
    base.passes_longos_completos = Math.round(base.passes_longos_tentados * (0.5 + rnd() * 0.15));
    base.passes_chave = rint(rnd, 0, 4);
    base.interceptacoes = rint(rnd, 2, 10);
    base.desarmes = rint(rnd, 0, 4);
    base.cartoes_amarelos = rint(rnd, 0, 2);
    base.metricas_posicao = {
      defesas: rint(rnd, 55, 140),
      clean_sheets: rint(rnd, 6, 16),
      media_gols_sofridos: Math.round((0.8 + rnd() * 1.2) * 10) / 10,
      distribuicao_com_maos: rint(rnd, 800, 1400),
      precisao_distribuicao_maos: rint(rnd, 70, 88),
    };
  } else if (DEF.has(pos)) {
    setPasses(550, 1000);
    base.passes_chave = rint(rnd, 5, 25);
    base.passes_longos_tentados = rint(rnd, 60, 140);
    base.passes_longos_completos = Math.round(base.passes_longos_tentados * (0.5 + rnd() * 0.2));
    base.desarmes = rint(rnd, 25, 85);
    base.interceptacoes = rint(rnd, 20, 70);
    base.cortes = rint(rnd, 25, 80);
    base.bolas_recuperadas = rint(rnd, 120, 210);
    base.duelos_aereos_ganhos = rint(rnd, 25, 75);
    base.duelos_aereos_perdidos = rint(rnd, 10, 35);
    base.gols_marcados = rint(rnd, 0, 4);
    base.assistencias = rint(rnd, 0, 5);
    base.finalizacoes = rint(rnd, 5, 30);
    base.finalizacoes_no_alvo = Math.round(base.finalizacoes * 0.4);
    base.xg = +((0.4 + rnd() * 3.6).toFixed(1));
    base.xa = +((0.2 + rnd() * 2.8).toFixed(1));
    base.cartoes_amarelos = rint(rnd, 3, 10);
  } else if (MID_DEF.has(pos)) {
    setPasses(650, 1250);
    base.passes_chave = rint(rnd, 20, 60);
    base.passes_longos_tentados = rint(rnd, 50, 120);
    base.passes_longos_completos = Math.round(base.passes_longos_tentados * (0.55 + rnd() * 0.2));
    base.desarmes = rint(rnd, 25, 70);
    base.interceptacoes = rint(rnd, 15, 55);
    base.bolas_recuperadas = rint(rnd, 110, 200);
    base.gols_marcados = rint(rnd, 1, 8);
    base.assistencias = rint(rnd, 2, 9);
    base.finalizacoes = rint(rnd, 15, 55);
    base.finalizacoes_no_alvo = Math.round(base.finalizacoes * 0.45);
    base.xg = +((1 + rnd() * 5).toFixed(1));
    base.xa = +((1.5 + rnd() * 6.5).toFixed(1));
    base.dribles_tentados = rint(rnd, 15, 60);
    base.dribles_completos = Math.round(base.dribles_tentados * (0.5 + rnd() * 0.25));
  } else if (MID_OFF.has(pos)) {
    setPasses(550, 1050);
    base.passes_chave = rint(rnd, 35, 85);
    base.gols_marcados = rint(rnd, 4, 13);
    base.assistencias = rint(rnd, 4, 14);
    base.finalizacoes = rint(rnd, 30, 80);
    base.finalizacoes_no_alvo = Math.round(base.finalizacoes * 0.48);
    base.xg = +((2.5 + rnd() * 8).toFixed(1));
    base.xa = +((3 + rnd() * 8).toFixed(1));
    base.desarmes = rint(rnd, 15, 45);
    base.dribles_tentados = rint(rnd, 30, 90);
    base.dribles_completos = Math.round(base.dribles_tentados * (0.55 + rnd() * 0.18));
  } else if (WING.has(pos)) {
    setPasses(400, 800);
    base.passes_chave = rint(rnd, 25, 70);
    base.gols_marcados = rint(rnd, 4, 15);
    base.assistencias = rint(rnd, 3, 12);
    base.finalizacoes = rint(rnd, 35, 100);
    base.finalizacoes_no_alvo = Math.round(base.finalizacoes * 0.45);
    base.xg = +((3 + rnd() * 9).toFixed(1));
    base.xa = +((2.5 + rnd() * 7.5).toFixed(1));
    base.desarmes = rint(rnd, 10, 35);
    base.dribles_tentados = rint(rnd, 45, 110);
    base.dribles_completos = Math.round(base.dribles_tentados * (0.5 + rnd() * 0.22));
  } else {
    // ATT / CF
    setPasses(200, 450);
    base.passes_chave = rint(rnd, 10, 35);
    base.gols_marcados = rint(rnd, 8, 24);
    base.assistencias = rint(rnd, 1, 7);
    base.finalizacoes = rint(rnd, 45, 130);
    base.finalizacoes_no_alvo = Math.round(base.finalizacoes * 0.47);
    base.xg = +((6 + rnd() * 14).toFixed(1));
    base.xa = +((1 + rnd() * 5).toFixed(1));
    base.dribles_tentados = rint(rnd, 20, 60);
    base.dribles_completos = Math.round(base.dribles_tentados * (0.45 + rnd() * 0.2));
    base.duelos_aereos_ganhos = rint(rnd, 15, 55);
    base.duelos_aereos_perdidos = rint(rnd, 20, 60);
    if (chance(rnd, 0.25)) {
      base.penalties_convertidos = rint(rnd, 1, 5);
    }
  }
  return base;
}

const LESOES_TIPO = [
  ["Muscular", ["Coxa", "Panturrilha", "Virilha", "Quadril"], 0.4],
  ["Ligamento", ["Tornozelo", "Joelho"], 0.2],
  ["Tendão", ["Joelho", "Panturrilha"], 0.12],
  ["Osso", ["Pé", "Panturrilha", "Mão/Braço"], 0.08],
  ["Concussão", ["Cabeça"], 0.08],
  ["Outro", ["Costas", "Ombro", "Quadril", "Virilha"], 0.12],
];
const GRAV = [
  ["Pequena (<7 dias)", 3, 6, 0.4],
  ["Moderada (7-28 dias)", 7, 27, 0.35],
  ["Severa (28-84 dias)", 28, 80, 0.2],
  ["Muito Severa (>84 dias)", 85, 180, 0.05],
];

function gerarLesao(rnd) {
  const [tipo, locais] = pick(rnd, LESOES_TIPO);
  const fatia = [];
  let acc = 0;
  for (const g of GRAV) { acc += g[3]; fatia.push([g, acc]); }
  const grav = choice(rnd, fatia);
  const dias = rint(rnd, grav[1], grav[2]);
  const inicio = addDays("2025-07-01", rint(rnd, 0, 400));
  const previsao = addDays(inicio, dias);
  const jogosPerdidos = Math.max(0, Math.round(dias / 7) + rint(rnd, -1, 1));
  const retornou = chance(rnd, 0.85);
  return {
    data_inicio: inicio,
    data_previsao_retorno: previsao,
    data_retorno_efetivo: retornou ? addDays(previsao, rint(rnd, -3, 14)) : null,
    dias_afastado: dias,
    jogos_perdidos: jogosPerdidos,
    tipo_lesao: tipo,
    localizacao: pick(rnd, locais),
    lado: pick(rnd, ["Esquerdo", "Direito", "Ambos"]),
    gravidade: grav[0],
    causa: pick(rnd, ["Contato", "Muscular sem contato", "Sobrecarga", "Recidiva", "Acidente de treino"]),
    recidiva: chance(rnd, 0.12),
    cirurgia_necessaria: chance(rnd, ["Ligamento", "Osso"].includes(tipo) ? 0.25 : 0.08),
    cirurgia_realizada: false,
    observacoes: null,
  };
}

function gerarAvaliacao(j, nota, rnd) {
  const idadeJ = idade(j.data_nascimento);
  const potencial = clamp(Math.round(92 - idadeJ * 1.15 + rint(rnd, -6, 6)), 45, 96);
  const tecnica = {};
  for (const k of ["passe_curto", "passe_longo", "passe_decisivo", "cruzamento", "finalizacao", "drible", "controle_bola", "recepcao", "visao_jogo", "inteligencia_tatica"]) {
    tecnica[k] = rint(rnd, 50, 94);
  }
  const fisica = {};
  for (const k of ["velocidade", "forca_fisica", "resistencia", "agilidade", "impulsao", "equilibrio", "coordenacao"]) {
    fisica[k] = rint(rnd, 50, 94);
  }
  const comportamental = {};
  for (const k of ["lideranca", "personalidade", "comprometimento", "adaptabilidade", "profissionalismo", "resiliencia", "disciplina_tatica", "relacionamento_grupo"]) {
    comportamental[k] = rint(rnd, 50, 94);
  }
  return {
    tecnica,
    fisica,
    comportamental,
    potencial_de_mercado:
      potencial >= 75 ? "Médio" : "Baixo",
    potencial_desenvolvimento: potencial,
    scout_responsavel: pick(rnd, SCOUTS),
    data_avaliacao: addDays("2026-01-01", rint(rnd, 0, 240)),
  };
}

// ---------- main ----------
(async () => {
  const { url, key } = lerEnvLocal();
  if (!url || !key) {
    console.error("env local não encontrada (.env.local)");
    process.exit(1);
  }
  const sb = createClient(url, key);
  const rnd = mulberry32(20260909);

  // 1. Carregar rosters
  const dir = path.join(__dirname, "data", "rosters");
  const rosters = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

  const total = rosters.reduce((s, r) => s + r.jogadores.length, 0);
  console.log(`Rosters: ${rosters.length}, jogadores: ${total}`);

  // 2. Purge
  const { error: delErr } = await sb.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) throw new Error(`Falha ao limpar players: ${delErr.message}`);
  console.log("Players antigos removidos (cascade)");

  // 3. Inserir
  const plano = [];
  for (const r of rosters) {
    for (const j of r.jogadores) {
      const { valor, fatorIdade } = gerarValor({ ...j, clube: r.clube, divisao: r.divisao }, rnd);
      const nota = gerarNota({ ...j, clube: r.clube, divisao: r.divisao }, rnd);
      const inicioContrato = addDays("2024-01-01", rint(rnd, 0, 700));
      const fimContrato = addDays(inicioContrato, rint(rnd, 700, 1400));
      plano.push({
        rosters: r,
        player: {
          nome_completo: j.nome,
          nome_usual: j.apelido,
          apelido: j.apelido,
          data_nascimento: j.data_nascimento,
          nacionalidade: j.nacionalidade,
          altura_cm: j.altura_cm,
          peso_kg: j.peso_kg,
          pe_dominante: j.pe,
          posicao_principal: j.posicao_principal,
          posicoes_alternativas: j.posicoes_alternativas,
          clube_atual: r.clube,
          liga_atual: r.liga,
          pais_clube: "Brasil",
          data_inicio_contrato: inicioContrato,
          data_fim_contrato: fimContrato,
          clausula_rescisao: Math.round((valor * (2.0 + rnd() * 1.5)) / 50000) * 50000,
          valor_mercado_estimado: valor,
          status_disponibilidade: choice(rnd, [["Disponível", 0.85], ["Em negociação", 0.08], ["Acertado com outro clube", 0.02], ["Indisponível", 0.05]]),
          nota_global: clamp(nota, 40, 96),
        },
        temLesao: chance(rnd, 0.34),
        temLesao2: false,
        temAvaliacao: chance(rnd, 0.72),
      });
    }
  }

  // marcar segunda lesão depois que a primeira foi decidida
  for (const p of plano) {
    if (p.temLesao) p.temLesao2 = chance(rnd, 0.18);
  }

  let ok = 0;
  const BATCH = 50;
  for (let i = 0; i < plano.length; i += BATCH) {
    const lote = plano.slice(i, i + BATCH).map((p) => p.player);
    const { data, error } = await sb.from("players").insert(lote).select("id, nome_completo");
    if (error) {
      console.error(`Erro no lote ${i}: ${error.message}`);
      continue;
    }
    for (let k = 0; k < data.length; k++) {
      const rec = plano[i + k];
      const id = data[k].id;
      try {
        await sb.from("season_stats").insert(gerarStats({ ...rec.player, clube: rec.rosters.clube, liga: rec.rosters.liga }, rnd));
        if (rec.temLesao) {
          await sb.from("player_injuries").insert({ player_id: id, ...gerarLesao(rnd) });
          if (rec.temLesao2) {
            await sb.from("player_injuries").insert({ player_id: id, ...gerarLesao(rnd) });
          }
        }
        if (rec.temAvaliacao) {
          await sb.from("player_evaluations").insert({
            player_id: id,
            ...gerarAvaliacao(rec.player, rec.player.nota_global, rnd),
          });
        }
        ok++;
      } catch (e) {
        console.error(`Erro relations p/ ${data[k].nome_completo}: ${e.message}`);
      }
    }
    console.log(`lote ${i}..${i + lote.length - 1} inserido`);
  }

  console.log(`Concluído: ${ok}/${plano.length} jogadores com relations`);

  const { count } = await sb.from("players").select("id", { count: "exact", head: true });
  console.log(`Total players na tabela: ${count}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});