// ============================================================
// iScout — Cliente Transfermarkt (extração sem custo)
// Busca (schnellsuche), perfil e stats por jogo (ceapi),
// com cache local e throttle para não sobrecarregar o site.
// Não é uma API oficial: pode quebrar se o TM mudar o HTML.
// ============================================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const CACHE_DIR = path.join(__dirname, "..", "data", "cache-tm");
const MIN_INTERVAL_MS = 2500;
const MAX_RETRIES = 3;

// ---------- normalização de texto (acento/caixa) ----------
function normalizar(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ---------- throttle simples (fila em cadeia) ----------
let lastRequestAt = 0;
let queue = Promise.resolve();

function aguardar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function agendar() {
  const now = Date.now();
  const espera = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - now) + Math.floor(Math.random() * 400);
  const p = queue.then(() => aguardar(espera));
  queue = p.then(
    () => {
      lastRequestAt = Date.now();
    },
    () => {}
  );
  return p;
}

// ---------- HTTP ----------
async function getCache(name, maxAgeMs = 1000 * 60 * 60 * 24 * 30) {
  const f = path.join(CACHE_DIR, name);
  try {
    if (!fs.existsSync(f)) return null;
    const st = fs.statSync(f);
    if (maxAgeMs > 0 && Date.now() - st.mtimeMs > maxAgeMs) return null;
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}

async function setCache(name, data) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const f = path.join(CACHE_DIR, name);
    fs.writeFileSync(f, JSON.stringify(data));
  } catch {
    // cache é opcional
  }
}

async function httpGet(url, { parse = "text", referer = "https://www.transfermarkt.com/" } = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await agendar();
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: parse === "json" ? "application/json" : "text/html,application/xhtml+xml",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          Referer: referer,
        },
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (res.status === 404) {
        throw new Error("HTTP 404");
      }
      if (parse === "json") return await res.json();
      return await res.text();
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      await aguardar(1500 * attempt + Math.random() * 1000);
    }
  }
  throw new Error("unreachable");
}

// ---------- busca de jogador ----------
// Retorna { bloqueado, cands }. "bloqueado" significa que o TM respondeu
// algo que não é uma página de resultados válida (rate-limit/anti-bot):
// nesse caso NAO cacheamos — quem chama deve aguardar e tentar de novo.
async function buscaJogador(query) {
  const q = normalizar(query);
  const cacheKey = `search-${crypto.createHash("md5").update(q).digest("hex")}.json`;
  const cached = await getCache(cacheKey, 1000 * 60 * 60 * 24 * 7);
  if (cached) return { cands: cached, bloqueado: false };

  const url = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(query)}`;
  const html = await httpGet(url);
  const cands = [];
  const re = /href="([^"]*\/profil\/spieler\/(\d+))"[^>]*>([^<]{1,80})<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const slug = m[1];
    const id = m[2];
    const nome = m[3].trim();
    cands.push({
      id,
      slug,
      nome,
      q: normalizar(nome),
      href: `https://www.transfermarkt.com${slug.startsWith("/") ? slug : "/" + slug}`,
      urlPerfil: `https://www.transfermarkt.com/profil/spieler/${id}`,
    });
  }
  if (!cands.length) {
    const bloqueado =
      html.length < 60000 ||
      /just a moment|checking your browser|access denied|captcha|cf-browser-verification/i.test(html);
    return { cands, bloqueado };
  }
  for (const c of cands) {
    const eq = c.q === q;
    const contains = c.q.includes(q) || q.includes(c.q);
    const qe = q.replace(/ /g, "");
    const sameNoSpace = c.q.replace(/ /g, "") === qe;
    c.score = eq ? 3 : sameNoSpace ? 2.5 : contains ? 1 : 0;
    if (c.q.startsWith(q) || c.q.endsWith(q)) c.score = Math.max(c.score, 1.5);
  }
  // desempate: nome mais longo em primeiro (nome completo costuma ser o certo)
  cands.sort((a, b) => b.score - a.score || b.q.length - a.q.length);
  await setCache(cacheKey, cands);
  return { cands, bloqueado: false };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- perfil ----------
function parsePerfil(html) {
  const meta = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const p = {};

  const nomeH1 = html.match(/data-header__headline-wrapper">\s*<span[^>]*>.*?<\/span>\s*([\w\s.,À-ÿÇç-]+?)<\/h1>/s);
  p.nome = nomeH1 ? nomeH1[1].trim() : null;

  const nasc = meta.match(/\*\s+(\d{1,2}\/\d{1,2}\/\d{4})/);
  p.nascimento = nasc ? nasc[1] : null;

  const valor = meta.match(/Market value:\s*[€$£]?\s*([\d.,]{1,12})\s*(bn|m|k)?\b/i);
  if (valor) {
    let num = parseFloat(valor[1].replace(",", "."));
    const suf = (valor[2] || "").toLowerCase();
    if (suf === "bn") num *= 1e9;
    else if (suf === "m") num *= 1e6;
    else if (suf === "k") num *= 1e3;
    p.valorMercado = isFinite(num) ? Math.round(num) : null;
  } else {
    p.valorMercado = null; // sem valor informado
  }

  const alt = html.match(/Height:\s*<\/span>\s*<span[^>]*>\s*([0-9.,]+)\s*m/);
  if (!alt) {
    p.alturaCm = null;
  } else {
    p.alturaCm = Math.round(parseFloat(alt[1].replace(",", ".")) * 100);
  }

  const pos = html.match(/Position:\s*<\/span>\s*<span[^>]*>\s*([A-Za-z \-/]+?)\s*<\/span>/);
  p.posicaoTm = pos ? pos[1].trim() : null;

  const clube = html.match(/data-header__club-link[^>]*>\s*<img([^>]*)>/s);
  const clubeTitulo = html.match(/<a[^>]*class="data-header__club"[^>]*>\s*<a[^>]*title="([^"]+)"/);
  const clube2 = html.match(/class="data-header__club"[^>]*>[\s\S]*?title="([^"]+)"/);
  p.clube = clubeTitulo ? clubeTitulo[1] : clube2 ? clube2[1] : clube ? (clube[1].match(/title="([^"]+)"/) || [])[1] || null : null;

  const foto = html.match(/src="(https:\/\/img\.a\.transfermarkt\.technology\/portrait\/header\/[^"]+)"/);
  p.foto = foto ? foto[1] : null;

  const ligaTm = html.match(/class="data-header__league-link"[^>]*>[\s\S]*?>(?:<img[^>]*>)?([A-Za-zÀ-ÿ0-9&\- ]+?)<\/a>/);
  p.liga = ligaTm ? ligaTm[1].trim() : null;

  return p;
}

async function getPerfil(id, href) {
  const cacheKey = `perfil-${id}.json`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  // a URL curta /profil/spieler/{id} responde 404; precisa do caminho com slug
  const url = href || `https://www.transfermarkt.com/${encodeURIComponent(id)}/profil/spieler/${id}`;
  const html = await httpGet(url);
  const perfil = parsePerfil(html);
  await setCache(cacheKey, perfil);
  return perfil;
}

// ---------- desempenho (por jogo, agregado por temporada) ----------
function fmtData(dt) {
  if (!dt) return null;
  return String(dt).slice(0, 10);
}

// A TM grava a temporada de formas diferentes conforme a página do
// jogador (ex.: "2026" vs "25/26"). Unifica para o ano-calendário.
function temporadaAno(season) {
  const targets = ["2024", "2025", "2026"];
  const cands = [season?.cyclicalName, season?.display];
  for (const c of cands) {
    const s = String(c || "");
    if (targets.includes(s)) return s;
  }
  const nc = String(season?.nonCyclicalName || "");
  const m = nc.match(/\/\d{2}$/);
  if (m) {
    const ano = 2000 + parseInt(nc.slice(-2), 10);
    if (targets.includes(String(ano))) return String(ano);
  }
  return null;
}

function agregarPerformance(games) {
  const EXCLUIR_TIPOS = new Set([11, 17, 19, 20]); // seleções
  const porTemporada = {};

  for (const g of games) {
    const gi = g.gameInformation;
    if (EXCLUIR_TIPOS.has(gi.competitionTypeId)) continue;
    const disp = temporadaAno(gi.season);
    if (!disp) continue;

    const t = porTemporada[disp] || {
      temporada: disp,
      jogos_disputados: 0,
      jogos_titular: 0,
      jogos_reserva_entrou: 0,
      jogos_nao_relacionado: 0,
      minutos_jogados: 0,
      gols_marcados: 0,
      assistencias: 0,
      finalizacoes: 0,
      finalizacoes_no_alvo: 0,
      chutes_bloqueados: 0,
      chutes_fora: 0,
      passes_tentados: 0,
      passes_completos: 0,
      cruzamentos_tentados: 0,
      desarmes: 0,
      faltas_cometidas: 0,
      faltas_sofridas: 0,
      cartoes_amarelos: 0,
      cartoes_vermelhos: 0,
      penalties_convertidos: 0,
      penalties_perdidos: 0,
      xg: null,
      xa: null,
    };
    const st = g.statistics;
    const gs = st.generalStatistics || {};
    const gols = st.goalStatistics || {};
    const cart = st.cardStatistics || {};
    const duel = st.duelStatistics || {};
    const dist = st.distributionStatistics || {};
    const pt = st.playingTimeStatistics || {};

    if (gs.participationState === "played") {
      t.jogos_disputados++;
      if (pt.isStarting) t.jogos_titular++;
      else t.jogos_reserva_entrou++;
    } else if (gs.participationState === "not in squad" || gs.participationState === "absent") {
      t.jogos_nao_relacionado++;
    }
    t.minutos_jogados += pt.playedMinutes || 0;
    t.gols_marcados += gols.goalsScoredTotal || 0;
    t.assistencias += gols.assists || 0;
    t.finalizacoes += gols.scoringAttempts || 0;
    t.finalizacoes_no_alvo += gols.scoringAttemptsOnGoal || 0;
    t.chutes_bloqueados += gols.scoringAttemptsBlocked || 0;
    t.chutes_fora += gols.scoringAttemptsOffGoal || 0;
    t.passes_tentados += dist.passes || 0;
    t.passes_completos += dist.passesReached || 0;
    t.cruzamentos_tentados += dist.corners || 0;
    t.desarmes += duel.tackles || 0;
    t.faltas_cometidas += duel.foulsCommitted || 0;
    t.faltas_sofridas += duel.foulsGained || 0;
    t.cartoes_amarelos += cart.yellowCardNet || 0;
    t.cartoes_vermelhos += cart.redCard ? 1 : 0;
    t.penalties_convertidos += gols.penaltyShooterGoalsScored || 0;
    t.penalties_perdidos += gols.penaltyShooterMisses || 0;

    porTemporada[disp] = t;
  }
  return Object.values(porTemporada).sort((a, b) => b.temporada.localeCompare(a.temporada));
}

async function getDesempenho(id) {
  const cacheKey = `desempenho-${id}.json`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  const url = `https://www.transfermarkt.com/ceapi/performance-game/${id}`;
  const json = await httpGet(url, {
    parse: "json",
    referer: `https://www.transfermarkt.com/profil/spieler/${id}`,
  });
  const games = json?.data?.performance || [];
  const res = { totalJogos: games.length, temporadas: agregarPerformance(games) };
  await setCache(cacheKey, res);
  return res;
}

module.exports = {
  normalizar,
  httpGet,
  sleep,
  buscaJogador,
  getPerfil,
  getPerfilCache,
  getDesempenho,
  getDesempenhoCache,
  CACHE_DIR,
};

// ---------- acesso somente ao cache (modo offline, sem rede) ----------
async function getPerfilCache(id) {
  const cached = await getCache(`perfil-${id}.json`);
  return cached || { semCache: true };
}

async function getDesempenhoCache(id) {
  const cached = await getCache(`desempenho-${id}.json`);
  return cached || { semCache: true, temporadas: [] };
}