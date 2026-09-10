// Reconstroi scripts/data/tm-map.json a partir da saída da run 1
// (log completo do puxar-transfermarkt). Mapeia clube|nome|apelido -> TM id
// para inserção offline enquanto o schnellsuche do TM está bloqueado.
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "data");
const LOG = "C:\\Users\\lenovo\\.local\\share\\opencode\\tool-output\\tool_0883c0746001ihGzDzH3Ma0fTL";

function ordemPosicao(p) {
  const m = { GOL: 0, ZAG: 1, ZAE: 1, ZAD: 1, LAT: 1, LAE: 1, LAD: 1, VOL: 2, MC: 2, MED: 2, MEC: 2, MEI: 3, SA: 3, PON: 3, PEE: 3, PED: 3, CA: 4, CF: 4 };
  return m[p] ?? 2;
}

// Seleção idêntica à do puxar-transfermarkt.js
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

const rosters = fs
  .readdirSync(path.join(DATA, "rosters"))
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => {
    const r = JSON.parse(fs.readFileSync(path.join(DATA, "rosters", f), "utf8"));
    return { clube: r.clube, destaques: selecionarDestaques(r.jogadores, 10) };
  });

const lines = fs.readFileSync(LOG, "latin1").split(/\r?\n/);
const mapa = {};
let achados = 0;

for (let ci = 0; ci < rosters.length; ci++) {
  const bloco = lines.filter((l) => l.startsWith(`[${ci + 1}/40] `));
  for (let j = 0; j < rosters[ci].destaques.length; j++) {
    const linha = bloco[j];
    if (!linha) continue;
    const m = linha.match(/TM (\d+) \((.*?)\)/);
    const jj = rosters[ci].destaques[j];
    if (m) {
      const chave = `${rosters[ci].clube}|${jj.nome}|${jj.apelido || ""}`;
      mapa[chave] = { tmId: Number(m[1]), tmNome: m[2], clube: rosters[ci].clube };
      achados++;
    }
  }
}

fs.writeFileSync(
  path.join(DATA, "tm-map.json"),
  JSON.stringify({ geradoEm: new Date().toISOString(), achados, mapa }, null, 2),
  "utf8"
);
console.log(`Mapa salvo: ${achados} achados em scripts/data/tm-map.json`);