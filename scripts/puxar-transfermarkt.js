// ============================================================
// iScout — Sincronização Real (Transfermarkt) — Série A e B 2026
// Lê scripts/data/rosters/*.json (destaques: primeiros 10/clube),
// encontra cada jogador no Transfermarkt, agrega stats 2024-2026
// e grava em players + season_stats no Supabase.
//
// UUID dos players é derivado do tm_id (UUID v5 determinístico),
// então re-executar nunca duplica (mesmo id) e dispensa DDL.
//
// Uso:
//   node scripts/puxar-transfermarkt.js            # todos os clubes
//   PILOT=flamengo node scripts/puxar-transfermarkt.js # um clube
//   LIMITE=3 PILOT=flamengo node scripts/puxar-transfermarkt.js
// ============================================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const tm = require("./lib/transfermarkt-client");

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

// ---------- UUID v5 determinístico (namespace iScout) ----------
const NAMESPACE = "f3f0b2a4-6c1e-4f0e-9a3c-1e0a5b7c9d01";
function nsBytes(hex) {
  return Buffer.from(hex.replace(/-/g, ""), "hex");
}
function uuidV5(ns, name) {
  const h = crypto.createHash("sha1").update(Buffer.concat([nsBytes(ns), Buffer.from(name, "utf8")])).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const hex = h.slice(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function idJogador(tmId) {
  return uuidV5(NAMESPACE, `transfermarkt:${tmId}`);
}

// ---------- data helpers ----------
function ordemPosicao(p) {
  const m = { GOL: 0, ZAG: 1, ZAE: 1, ZAD: 1, LAT: 1, LAE: 1, LAD: 1, VOL: 2, MC: 2, MED: 2, MEC: 2, MEI: 3, SA: 3, PON: 3, PEE: 3, PED: 3, CA: 4, CF: 4 };
  return m[p] ?? 2;
}

// Seleção de "destaques" balanceada por posição (1 GOL, 3 DEF, 3 MID, 3 ATT),
// depois completa com o restante do elenco até o limite.
function selecionarDestaques(jogadores, limite) {
  const grupos = { GOL: [], DEF: [], MID: [], ATT: [] };
  for (const j of jogadores || []) {
    const o = ordemPosicao(j.posicao_principal);
    if (o === 0) grupos.GOL.push(j);
    else if (o === 1) grupos.DEF.push(j);
    else if (o === 2 || o === 3) grupos.MID.push(j);
    else grupos.ATT.push(j);
  }
  const out = [];
  const quotas = { GOL: 1, DEF: 3, MID: 3, ATT: 3 };
  for (const g of ["GOL", "DEF", "MID", "ATT"]) out.push(...grupos[g].slice(0, quotas[g]));
  const pool = [...grupos.ATT.slice(3), ...grupos.MID.slice(3), ...grupos.DEF.slice(3), ...grupos.GOL.slice(1)];
  for (const j of pool) {
    if (out.length >= limite) break;
    out.push(j);
  }
  return out.slice(0, limite);
}

function paraDataIso(ddmmaaaa) {
  if (!ddmmaaaa) return null;
  const m = String(ddmmaaaa).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

// ---------- resolução de jogador via mapa local ou busca TM ----------
const MAPA = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "data", "tm-map.json"), "utf8")).mapa || {};
  } catch {
    return {};
  }
})();
const OFFLINE = process.env.OFFLINE === "1";

async function resolverJogador(j, r) {
  // 1. mapa offline (gerado da run anterior) — sem tocar a rede
  const chaveMapa = `${r.clube}|${j.nome}|${j.apelido || ""}`;
  const map = MAPA[chaveMapa];
  if (map) {
    return {
      query: null,
      origem: "mapa",
      best: {
        id: String(map.tmId),
        nome: map.tmNome,
        href: `https://www.transfermarkt.com/${encodeURIComponent(map.tmNome)}/profil/spieler/${map.tmId}`,
        urlPerfil: `https://www.transfermarkt.com/profil/spieler/${map.tmId}`,
      },
    };
  }

  if (OFFLINE) return null; // sem rede: nada a fazer se não há cache de busca

  const queries = [];
  if (j.apelido && String(j.apelido).trim().length >= 3) queries.push(j.apelido.trim());
  if (j.nome) queries.push(j.nome.trim());

  for (const q of queries[0] ? queries.slice(0, 2) : queries) {
    const res = await tm.buscaJogador(q);
    // Se bloqueado, NÃO fica retentando aqui: sinaliza pro loop principal, que
    // aplica um cooldown global (o retry in-place 12→51s por query devorava horas).
    if (res.bloqueado) {
      return { bloqueado: true };
    }
    if (!res.cands.length) break;
    const best = res.cands[0];
    // igualdade forte ou melhor colocação; desempate por nome mais longo já
    // ordenado no client. Aceita a partir de score 1 (contém o termo).
    if (best.score >= 1) {
      return { query: q, cands: res.cands.slice(0, 3), best };
    }
    break;
  }
  return null;
}

// ---------- montagem do registro ----------
function montarPlayer(j, r, perfil) {
  return {
    id: null, // setado depois
    nome_completo: j.nome,
    nome_usual: j.apelido || null,
    apelido: j.apelido || null,
    data_nascimento: paraDataIso(perfil.nascimento) || j.data_nascimento || null,
    nacionalidade: j.nacionalidade || null,
    altura_cm: perfil.alturaCm || j.altura_cm || null,
    peso_kg: j.peso_kg || null,
    pe_dominante: j.pe || null,
    posicao_principal: j.posicao_principal,
    posicoes_alternativas: j.posicoes_alternativas || [],
    clube_atual: r.clube || perfil.clube,
    liga_atual: r.liga || perfil.liga,
    pais_clube: "Brasil",
    data_inicio_contrato: null,
    data_fim_contrato: null,
    clausula_rescisao: null,
    valor_mercado_estimado: perfil.valorMercado,
    status_disponibilidade: "Disponível",
    nota_global: null,
    foto_url: perfil.foto || null,
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

  const pilot = (process.env.PILOT || "").toLowerCase().replace(/\.json$/, "");
  const limitePorClube = parseInt(process.env.LIMITE || "10", 10);

  // 1. rosters
  const dir = path.join(__dirname, "data", "rosters");
  let rosters = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }));
  if (pilot) rosters = rosters.filter((r) => r.file.replace(/\.json$/, "") === pilot);
  if (!rosters.length) {
    console.error(`Nenhum roster encontrado (PILOT='${pilot}')`);
    process.exit(1);
  }

  const destaques = [];
  for (const r of rosters) {
    const js = selecionarDestaques(r.jogadores, limitePorClube);
    destaques.push({ roster: r, jogadores: js });
  }
  const total = destaques.reduce((s, d) => s + d.jogadores.length, 0);
  console.log(`Clubes: ${rosters.length} | destaques: ${total} (LIMITE=${limitePorClube}/clube)`);

  // 2. resolver + coletar
  let achados = [];
  const semMatch = [];
  const pendentes = [];
  let erros = 0;
  let bloqueiosConsec = 0;
  const COOLDOWN_MS = parseInt(process.env.TM_COOLDOWN_MS || "300000", 10); // 5 min
  // mapa incremental: grava a cada clube, então mesmo se for interrompida no meio
  // (timeout/bloqueio), o OFFLINE=1 consegue mandar o cache pro Supabase.
  const MapaCaminho = path.join(__dirname, "data", "tm-map.json");
  function salvarMapa(mapaNovos) {
    if (!Object.keys(mapaNovos).length) return;
    const base = fs.existsSync(MapaCaminho)
      ? JSON.parse(fs.readFileSync(MapaCaminho, "utf8")).mapa || {}
      : {};
    Object.assign(base, mapaNovos);
    fs.writeFileSync(MapaCaminho, JSON.stringify({ geradoEm: new Date().toISOString(), achados: Object.keys(base).length, mapa: base }, null, 2), "utf8");
  }
  const mapaNovos = {};
  for (let i = 0; i < destaques.length; i++) {
    const { roster, jogadores } = destaques[i];
    let nClube = 0;
    for (const j of jogadores) {
      process.stdout.write(
        `[${i + 1}/${rosters.length}] ${roster.clube} — ${j.apelido || j.nome} ... `
      );
      try {
        const res = await resolverJogador(j, roster);
        if (res && res.origem === "mapa") {
          process.stdout.write(`(mapa) `);
        }
        if (res && res.bloqueado) {
          // bloquios intermitentes: após 3 seguidos, cooldown global e volta
          bloqueiosConsec++;
          if (bloqueiosConsec >= 3) {
            process.stdout.write(`(cooldown ${Math.round(COOLDOWN_MS / 60000)}min) `);
            await tm.sleep(COOLDOWN_MS);
            bloqueiosConsec = 0;
          }
          semMatch.push({ clube: roster.clube, nome: j.nome, apelido: j.apelido, motivo: "bloqueado" });
          console.log("sem match (bloqueado)");
          continue;
        }
        bloqueiosConsec = 0;
        if (!res) {
          semMatch.push({ clube: roster.clube, nome: j.nome, apelido: j.apelido });
          console.log("sem match");
          continue;
        }
        const perf = OFFLINE
          ? await tm.getPerfilCache(res.best.id)
          : await tm.getPerfil(res.best.id, res.best.href);
        const perf3 = OFFLINE
          ? await tm.getDesempenhoCache(res.best.id)
          : await tm.getDesempenho(res.best.id);
        if (OFFLINE && (perf.semCache || perf3.semCache)) {
          pendentes.push({ clube: roster.clube, nome: j.nome, tmId: res.best.id, motivo: "sem cache" });
          console.log("pendente (sem cache)");
          continue;
        }
        const temporadas = perf3.temporadas || [];
        const lesoes = OFFLINE
          ? await tm.getLesoesCache(res.best.id)
          : await tm.getLesoes(res.best.id, res.best.href);
        achados.push({
          roster,
          j,
          tmId: res.best.id,
          matchNome: res.best.nome,
          query: res.query,
          perfil: perf,
          temporadas,
          lesoes: lesoes.lesoes || [],
        });
        mapaNovos[`${roster.clube}|${j.nome}|${j.apelido || ""}`] = {
          tmId: Number(res.best.id),
          tmNome: res.best.nome,
          clube: roster.clube,
        };
        nClube++;
        console.log(`TM ${res.best.id} (${res.best.nome}) | temporadas: ${temporadas.map((t) => t.temporada).join(",")}`);
      } catch (e) {
        erros++;
        console.log(`ERRO: ${e.message}`);
      }
    }
    if (nClube === 0) console.log(`  → ${roster.clube}: nenhum match`);
    salvarMapa(mapaNovos);
    for (const k of Object.keys(mapaNovos)) delete mapaNovos[k];
  }

  console.log(`\nResolução bruta: ${achados.length} achados, ${semMatch.length} sem match, ${erros} erros`);

  // dedupe por tm_id (mesmo jogador pode ter sido resolvido em mais de um clube)
  const duplicados = [];
  const vistos = new Set();
  const unicos = [];
  for (const a of achados) {
    if (vistos.has(a.tmId)) {
      duplicados.push({ clube: a.roster.clube, nome: a.j.nome, tmId: a.tmId, primeiroClube: unicos.find(u => u.tmId === a.tmId)?.roster.clube });
      continue;
    }
    vistos.add(a.tmId);
    unicos.push(a);
  }
  achados = unicos;
  if (duplicados.length) {
    console.log(`Duplicatas descartadas: ${duplicados.length}`);
    for (const d of duplicados) console.log(`  - ${d.clube} / ${d.nome} → já resolvido como ${d.primeiroClube} (TM ${d.tmId})`);
  }

  if (semMatch.length) {
    console.log("Sem match (precisam revisão manual):");
    for (const s of semMatch) console.log(`  - ${s.clube} / ${s.nome} (${s.apelido})`);
  }
  if (pendentes.length) {
    console.log(`Pendentes (offline, sem cache): ${pendentes.length}`);
    for (const p of pendentes) console.log(`  - ${p.clube} / ${p.nome} (TM ${p.tmId}) ${p.motivo}`);
  }

  // 3. purge (cascade limpa stats/lesões/avaliações antigas)
  const { error: delErr } = await sb
    .from("players")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) throw new Error(`Falha ao limpar players: ${delErr.message}`);
  console.log("Players anteriores removidos (cascade)");

  // 4. inserir players
  const registros = achados.map((a) => ({
    ...montarPlayer(a.j, a.roster, a.perfil),
    id: idJogador(a.tmId),
  }));

  let okPlayers = 0;
  const BATCH = 50;
  for (let i = 0; i < registros.length; i += BATCH) {
    const lote = registros.slice(i, i + BATCH);
    const { error } = await sb.from("players").upsert(lote);
    if (error) {
      console.error(`Erro players lote ${i}: ${error.message}`);
      continue;
    }
    okPlayers += lote.length;
  }
  console.log(`Players inseridos: ${okPlayers}/${registros.length}`);

  // 5. inserir season_stats
  let okStats = 0;
  let errStats = 0;
  for (const a of achados) {
    const pid = idJogador(a.tmId);
    for (const t of a.temporadas) {
      const { error } = await sb.from("season_stats").insert({
        player_id: pid,
        temporada: t.temporada,
        clube: a.roster.clube || a.perfil.clube,
        liga: a.roster.liga || a.perfil.liga,
        jogos_disputados: t.jogos_disputados,
        jogos_titular: t.jogos_titular,
        jogos_reserva_entrou: t.jogos_reserva_entrou,
        jogos_nao_relacionado: t.jogos_nao_relacionado,
        minutos_jogados: t.minutos_jogados,
        gols_marcados: t.gols_marcados,
        assistencias: t.assistencias,
        finalizacoes: t.finalizacoes,
        finalizacoes_no_alvo: t.finalizacoes_no_alvo,
        chutes_bloqueados: t.chutes_bloqueados,
        chutes_fora: t.chutes_fora,
        passes_tentados: t.passes_tentados,
        passes_completos: t.passes_completos,
        cruzamentos_tentados: t.cruzamentos_tentados,
        desarmes: t.desarmes,
        faltas_cometidas: t.faltas_cometidas,
        faltas_sofridas: t.faltas_sofridas,
        cartoes_amarelos: t.cartoes_amarelos,
        cartoes_vermelhos: t.cartoes_vermelhos,
        penalties_convertidos: t.penalties_convertidos,
        penalties_perdidos: t.penalties_perdidos,
        xg: null,
        xa: null,
        metricas_posicao: {},
        intensidade_fisica: {},
      });
      if (error) {
        errStats++;
        console.error(`Erro season_stats ${a.j.apelido || a.j.nome} ${t.temporada}: ${error.message}`);
      } else {
        okStats++;
      }
    }
  }
  console.log(`season_stats inseridos: ${okStats} (erros: ${errStats})`);

  // 5.b inserir player_injuries
  let okLesoes = 0;
  let errLesoes = 0;
  for (const a of achados) {
    const pid = idJogador(a.tmId);
    for (const l of a.lesoes || []) {
      const { error } = await sb.from("player_injuries").insert({
        player_id: pid,
        data_inicio: l.dataInicio,
        data_previsao_retorno: null,
        data_retorno_efetivo: l.dataRetornoEfetivo,
        dias_afastado: l.diasAfastado,
        jogos_perdidos: l.jogosPerdidos,
        tipo_lesao: l.tipo,
        localizacao: l.localizacao,
        lado: null,
        gravidade: l.gravidade,
        causa: l.causa,
        recidiva: l.recidiva,
        cirurgia_necessaria: l.cirurgia,
        cirurgia_realizada: l.cirurgia,
        medicacao: null,
        departamento_medico: null,
        tratamento: null,
        observacoes: l.observacoes,
      });
      if (error) {
        errLesoes++;
        console.error(`Erro player_injuries ${a.j.apelido || a.j.nome}: ${error.message}`);
      } else {
        okLesoes++;
      }
    }
  }
  console.log(`player_injuries inseridos: ${okLesoes} (erros: ${errLesoes})`);

  // 6. relatório
  const rel = {
    geradoEm: new Date().toISOString(),
    pilot,
    limitePorClube,
    clubes: rosters.length,
    destaques: total,
    achados: achados.length,
    semMatch: semMatch.length,
    pendentes: pendentes.length,
    erros,
    playersInsertidos: okPlayers,
    seasonStatsInsertidos: okStats,
    injuriesInsertidos: okLesoes,
    semMatchDetalhe: semMatch,
    pendentesDetalhe: pendentes,
  };
  const relPath = path.join(tm.CACHE_DIR, "ultima-sync.json");
  fs.mkdirSync(tm.CACHE_DIR, { recursive: true });
  fs.writeFileSync(relPath, JSON.stringify(rel, null, 2));
  console.log(`Relatório: ${relPath}`);

  const { count } = await sb.from("players").select("id", { count: "exact", head: true });
  console.log(`Total players na tabela: ${count}`);

  // 7. auto-avaliação: a purge em cascade apaga player_evaluations, então todo
  // sync que grava precisa re-derivar as avaliações (idempotente).
  try {
    const { spawnSync } = require("child_process");
    const r = spawnSync(process.execPath, [path.join(__dirname, "calcular-avaliacoes.js")], {
      stdio: "inherit",
    });
    if (r.status !== 0) {
      console.warn(`Atenção: auto-avaliação falhou (exit ${r.status}) — rode manualmente.`);
    }
  } catch (e) {
    console.warn(`Atenção: auto-avaliação falhou: ${e.message} — rode manualmente.`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});