// Agendador de sincronização do Transfermarkt.
// Fica sondando a busca TM a cada TM_PROBE_INTERVAL_MS (default 10 min);
// quando o anti-bot liberar (busca voltar a responder com resultados),
// roda o puxar-transfermarkt.js (modo rede, com lesões) até o fim, grava
// log e um marcador SYNC_OK, e encerra.
//
// Uso: node scripts/sincronizar-tm.js          (roda até completar o sync)
//       node scripts/sincronizar-tm.js --uma-vez (uma sonda e sai)
const fs = require("fs");
const path = require("path");
const { spawn, execFileSync } = require("child_process");
const tm = require("./lib/transfermarkt-client");

const CACHE = path.join(__dirname, "data", "cache-tm");
const INTERVALO = parseInt(process.env.TM_PROBE_INTERVAL_MS || "", 10) || 600000; // 10 min
const UMA_VEZ = process.argv.includes("--uma-vez");

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function sondarLivre() {
  const url = "https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=Pedro";
  const html = await tm.httpGet(url);
  return /profil\/spieler\/\d+/.test(html);
}

async function aguardarBlocos(maxMs) {
  const inicio = Date.now();
  while (Date.now() - inicio < maxMs) {
    let livre = false;
    try {
      livre = await sondarLivre();
    } catch (e) {
      log(`sondagem falhou (${e.message})`);
    }
    if (livre) {
      log("Transfermarkt liberado — iniciando sync completo...");
      return true;
    }
    log("ainda bloqueado; próxima sondagem em " + Math.round(INTERVALO / 60000) + " min");
    await tm.sleep(INTERVALO);
    await tm.sleep(3200); // margem sobre o throttle interno do client
  }
  return false;
}

function rodarSync() {
  return new Promise((resolve) => {
    fs.mkdirSync(CACHE, { recursive: true });
    const logFile = path.join(CACHE, `sync-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
    const out = fs.openSync(logFile, "a");
    log(`rodando puxar-transfermarkt.js (log: ${logFile})`);
    const child = spawn(process.execPath, [path.join(__dirname, "puxar-transfermarkt.js")], {
      stdio: ["inherit", out, out],
      env: process.env,
    });
    child.on("close", (code) => {
      fs.closeSync(out);
      fs.writeFileSync(
        path.join(CACHE, "SYNC_OK.json"),
        JSON.stringify({ geradoEm: new Date().toISOString(), exitCode: code, log: logFile }, null, 2)
      );
      log(`sync finalizado (exit ${code}); marcador em SYNC_OK.json`);
      resolve(code);
    });
  });
}

(async () => {
  if (UMA_VEZ) {
    let livre = false;
    try {
      livre = await sondarLivre();
    } catch (e) {
      log(`sondagem falhou (${e.message})`);
    }
    log(livre ? "TM livre" : "TM ainda bloqueado");
    if (!livre) process.exit(2);
    const code = await rodarSync();
    process.exit(code);
  }
  const maxMs = parseInt(process.env.TM_MAX_ESPERA_MS || "0", 10); // 0 = infinito
  const ok = await aguardarBlocos(maxMs || Infinity);
  if (!ok) {
    log("Tempo de espera esgotado sem liberar o TM. Encerrando.");
    process.exit(2);
  }
  const code = await rodarSync();
  process.exit(code);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});