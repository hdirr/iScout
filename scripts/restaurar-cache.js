// ============================================================
// iScout — Restaura o acúmulo do Supabase para o disco local
// ------------------------------------------------------------
// Baixa public.tm_data_cache e reconstrói:
//   - cache-tm/{chave}         (perfil/desempenho/lesoes/search)
//   - data/tm-map.json         (kind 'mapa' → chave tm-map.json)
//   - cache-tm/ultima-sync.json(kind 'relatorio')
//
// Útil para recuperar o acúmulo local em outra máquina (o cache
// local é gitignored e o banco players/stats/lesoes já vive no
// Supabase, então esta função repõe apenas o que falta pro OFFLINE).
//
// Uso:
//   node scripts/restaurar-cache.js
// ============================================================
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const CACHE_DIR = path.join(__dirname, "data", "cache-tm");
const MAPA_PATH = path.join(__dirname, "data", "tm-map.json");
const BATCH = 500;

function lerEnvLocal() {
  const p = path.join(__dirname, "..", ".env.local");
  const txt = fs.readFileSync(p, "utf8");
  const get = (k) => {
    const m = txt.match(new RegExp(`^${k}=(.*)$`, "m"));
    return m ? m[1].trim() : null;
  };
  return { url: get("NEXT_PUBLIC_SUPABASE_URL"), key: get("NEXT_PUBLIC_SUPABASE_ANON_KEY") };
}

(async () => {
  const env = lerEnvLocal();
  const sb = createClient(env.url, env.key);

  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await sb
      .from("tm_data_cache")
      .select("kind,chave,payload")
      .range(from, from + BATCH - 1);
    if (error) throw new Error(`Falha ao consultar tm_data_cache: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < BATCH) break;
    from += BATCH;
  }

  console.log(`Baixados ${rows.length} artefatos.`);
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  let arquivos = 0;
  let mapa = 0;
  let rel = 0;
  for (const r of rows) {
    if (r.kind === "mapa") {
      fs.writeFileSync(MAPA_PATH, JSON.stringify(r.payload, null, 2), "utf8");
      mapa++;
    } else if (r.kind === "relatorio") {
      fs.writeFileSync(path.join(CACHE_DIR, r.chave), JSON.stringify(r.payload, null, 2), "utf8");
      rel++;
    } else {
      fs.writeFileSync(path.join(CACHE_DIR, r.chave), JSON.stringify(r.payload), "utf8");
      arquivos++;
    }
  }

  console.log(`Restaurados: ${arquivos} caches, ${mapa} mapa, ${rel} relatório.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});