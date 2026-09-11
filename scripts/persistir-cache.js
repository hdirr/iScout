// ============================================================
// iScout — Persiste o acúmulo local do Transfermarkt no Supabase
// ------------------------------------------------------------
// Sobe para a tabela public.tm_data_cache:
//   - cache-tm/*.json           (perfil-/desempenho-/lesoes-/search-)
//   - data/tm-map.json          (kind 'mapa')
//   - cache-tm/ultima-sync.json (kind 'relatorio')
//
// UPSERT por (kind, chave) — idempotente/acumulativo.
//
// Uso:
//   node scripts/persistir-cache.js             # tudo
//   node scripts/persistir-cache.js --somente-map  # só mapa + relatório
// ============================================================
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const CACHE_DIR = path.join(__dirname, "data", "cache-tm");
const MAPA_PATH = path.join(__dirname, "data", "tm-map.json");
const BATCH = 100;

function lerEnvLocal() {
  const p = path.join(__dirname, "..", ".env.local");
  const txt = fs.readFileSync(p, "utf8");
  const get = (k) => {
    const m = txt.match(new RegExp(`^${k}=(.*)$`, "m"));
    return m ? m[1].trim() : null;
  };
  return { url: get("NEXT_PUBLIC_SUPABASE_URL"), key: get("NEXT_PUBLIC_SUPABASE_ANON_KEY") };
}

const SO_MENTE_MAP = process.argv.includes("--somente-map");
// prefixes de cache que merecem upload (arquivo inteiro por row)
const PREFIXOS = ["perfil-", "desempenho-", "lesoes-", "search-"];

function coletar() {
  const linhas = [];

  if (!SO_MENTE_MAP) {
    if (fs.existsSync(CACHE_DIR)) {
      for (const f of fs.readdirSync(CACHE_DIR)) {
        if (!f.endsWith(".json")) continue;
        const prefixo = PREFIXOS.find((p) => f.startsWith(p));
        if (!prefixo) continue;
        const caminho = path.join(CACHE_DIR, f);
        const payload = JSON.parse(fs.readFileSync(caminho, "utf8"));
        linhas.push({ kind: prefixo.replace(/-$/, ""), chave: f, payload });
      }
    }
  }

  if (fs.existsSync(MAPA_PATH)) {
    linhas.push({
      kind: "mapa",
      chave: "tm-map.json",
      payload: JSON.parse(fs.readFileSync(MAPA_PATH, "utf8")),
    });
  }

  const rel = path.join(CACHE_DIR, "ultima-sync.json");
  if (fs.existsSync(rel)) {
    linhas.push({
      kind: "relatorio",
      chave: "ultima-sync.json",
      payload: JSON.parse(fs.readFileSync(rel, "utf8")),
    });
  }

  return linhas;
}

(async () => {
  const env = lerEnvLocal();
  const sb = createClient(env.url, env.key);
  const linhas = coletar();

  console.log(`Coletados ${linhas.length} artefatos${SO_MENTE_MAP ? " (somente mapa + relatório)" : ""}`);

  let ok = 0;
  let erros = 0;
  for (let i = 0; i < linhas.length; i += BATCH) {
    const lote = linhas
      .slice(i, i + BATCH)
      .map((l) => ({ ...l, atualizado_em: new Date().toISOString() }));
    const { error } = await sb.from("tm_data_cache").upsert(lote, { onConflict: "kind,chave" });
    if (error) {
      erros += lote.length;
      console.error(`Erro no lote ${i}: ${error.message}`);
    } else {
      ok += lote.length;
      process.stdout.write(`\r  subidos ${ok}/${linhas.length}`.padEnd(50));
    }
  }
  console.log(`\nPronto: ${ok} OK, ${erros} erros.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});