import Link from "next/link";
import { getPlayer } from "@/lib/data/players";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { montarRelatorio } from "@/lib/reporte";
import { formatarMoedaEUR } from "@/lib/utils";
import { RadarChart } from "@/components/radar-grafico";
import { POSICAO_LABEL, type PlayerWithStats, type Posicao } from "@/lib/types";

export const metadata = { title: "Comparar jogadores" };

type SearchParams = Record<string, string | string[] | undefined>;

const CORES = ["#38bdf8", "#fb923c", "#a78bfa"];

type LinhaComparacao = {
  rotulo: string;
  valores: (string | null)[];
  melhor: number | null;
};

function melhorIndice(numeros: (number | null)[]): number | null {
  let idx: number | null = null;
  let melhor: number | null = null;
  numeros.forEach((v, i) => {
    if (v !== null && v !== undefined && (melhor === null || v > melhor)) {
      melhor = v;
      idx = i;
    }
  });
  return idx;
}

function menorIndice(numeros: (number | null)[]): number | null {
  let idx: number | null = null;
  let melhor: number | null = null;
  numeros.forEach((v, i) => {
    if (v !== null && v !== undefined && (melhor === null || v < melhor)) {
      melhor = v;
      idx = i;
    }
  });
  return idx;
}

const ORDEM_RISCO: Record<string, number> = { Baixo: 1, Médio: 2, Alto: 3 };

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const idsRaw = typeof sp.ids === "string" ? sp.ids : "";
  const ids = idsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  let jogadores: PlayerWithStats[] = [];
  let erro: string | null = null;

  if (isSupabaseConfigured() && ids.length > 0) {
    try {
      const resultados = await Promise.all(ids.map((id) => getPlayer(id)));
      jogadores = resultados.filter((j): j is PlayerWithStats => j !== null);
    } catch (e) {
      erro = e instanceof Error ? e.message : "Erro ao carregar jogadores.";
    }
  }

  if (jogadores.length < 2) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Comparar jogadores</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          {erro
            ? `Não foi possível carregar: ${erro}`
            : "Selecione 2 a 3 jogadores na lista para comparar lado a lado."}
        </p>
        <Link
          href="/jogadores"
          className="mt-6 inline-block rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const rels = jogadores.map((j) => montarRelatorio(j));
  const ultima = rels.map((r) => r.evolucao[0] ?? null);
  const totais = rels.map((r) =>
    r.evolucao.reduce(
      (s, t) => ({ gols: s.gols + t.gols, assist: s.assist + t.assistencias }),
      { gols: 0, assist: 0 }
    )
  );

  const linhas: LinhaComparacao[] = [
    {
      rotulo: "Nota global",
      valores: rels.map((r) => (r.resumo.nota !== null ? r.resumo.nota.toFixed(1) : null)),
      melhor: melhorIndice(rels.map((r) => r.resumo.nota)),
    },
    {
      rotulo: "Potencial",
      valores: rels.map((r) => (r.resumo.potencial !== null ? String(r.resumo.potencial) : null)),
      melhor: melhorIndice(rels.map((r) => r.resumo.potencial)),
    },
    {
      rotulo: "G+A/90",
      valores: ultima.map((t) => (t?.ga_por_90 !== null && t?.ga_por_90 !== undefined ? String(t.ga_por_90) : null)),
      melhor: melhorIndice(ultima.map((t) => t?.ga_por_90 ?? null)),
    },
    {
      rotulo: "Gols/90",
      valores: ultima.map((t) => (t?.gols_por_90 !== null && t?.gols_por_90 !== undefined ? String(t.gols_por_90) : null)),
      melhor: melhorIndice(ultima.map((t) => t?.gols_por_90 ?? null)),
    },
    {
      rotulo: "Assist/90",
      valores: ultima.map((t) => (t?.assistencias_por_90 !== null && t?.assistencias_por_90 !== undefined ? String(t.assistencias_por_90) : null)),
      melhor: melhorIndice(ultima.map((t) => t?.assistencias_por_90 ?? null)),
    },
    {
      rotulo: "Precisão de passes",
      valores: ultima.map((t) => (t?.precisao_passes !== null && t?.precisao_passes !== undefined ? `${t.precisao_passes}%` : null)),
      melhor: melhorIndice(ultima.map((t) => t?.precisao_passes ?? null)),
    },
    {
      rotulo: "Jogos (última temporada)",
      valores: ultima.map((t) => (t ? String(t.jogos) : null)),
      melhor: melhorIndice(ultima.map((t) => (t ? t.jogos : null))),
    },
    {
      rotulo: "Gols totais",
      valores: totais.map((t) => String(t.gols)),
      melhor: melhorIndice(totais.map((t) => t.gols)),
    },
    {
      rotulo: "Assistências totais",
      valores: totais.map((t) => String(t.assist)),
      melhor: melhorIndice(totais.map((t) => t.assist)),
    },
    {
      rotulo: "Valor de mercado",
      valores: rels.map((r) => formatarMoedaEUR(r.mercado.valor_mercado)),
      melhor: null,
    },
    {
      rotulo: "Idade",
      valores: rels.map((r) => (r.resumo.idade !== null ? `${r.resumo.idade} anos` : null)),
      melhor: null,
    },
    {
      rotulo: "Risco de lesão",
      valores: rels.map((r) => r.resumo.risco_lesao),
      melhor: menorIndice(
        rels.map((r) => {
          const n = ORDEM_RISCO[r.resumo.risco_lesao];
          return n ?? null;
        })
      ),
    },
    {
      rotulo: "Maior afastamento",
      valores: rels.map((r) =>
        r.max_dias_afastado > 0 ? `${r.max_dias_afastado} dias` : "—"
      ),
      melhor: menorIndice(rels.map((r) => (r.max_dias_afastado > 0 ? r.max_dias_afastado : null))),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comparar jogadores</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {jogadores.length} jogador(es) lado a lado.
          </p>
        </div>
        <Link
          href="/jogadores"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          ← Alterar seleção
        </Link>
      </div>

      {/* Cards dos jogadores */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jogadores.map((j, i) => (
          <div
            key={j.id}
            className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
          >
            <div
              className="h-1"
              style={{ backgroundColor: CORES[i % CORES.length] }}
            />
            <div className="flex items-center gap-3 p-4">
              {j.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={j.foto_url}
                  alt={j.nome_completo}
                  className="h-12 w-12 shrink-0 rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-base font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {j.nome_completo.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <Link
                  href={`/jogadores/${j.id}`}
                  className="block truncate font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {j.nome_completo}
                </Link>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {POSICAO_LABEL[j.posicao_principal as Posicao] ?? j.posicao_principal} ·{" "}
                  {j.clube_atual ?? "Sem clube"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-zinc-100 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
              <div className="bg-white px-3 py-2 text-center dark:bg-zinc-950">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Nota</p>
                <p className="font-bold">
                  {rels[i].resumo.nota !== null ? rels[i].resumo.nota.toFixed(1) : "—"}
                </p>
              </div>
              <div className="bg-white px-3 py-2 text-center dark:bg-zinc-950">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Idade</p>
                <p className="font-bold">
                  {rels[i].resumo.idade !== null ? `${rels[i].resumo.idade}` : "—"}
                </p>
              </div>
              <div className="bg-white px-3 py-2 text-center dark:bg-zinc-950">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Valor</p>
                <p className="text-xs font-bold">
                  {formatarMoedaEUR(j.valor_mercado_estimado)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Radars */}
      <div
        className={`mt-8 grid gap-6 ${
          jogadores.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {jogadores.map((j, i) => (
          <div
            key={j.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h2 className="text-sm font-semibold" style={{ color: CORES[i % CORES.length] }}>
              {j.nome_completo}
            </h2>
            <RadarChart eixos={rels[i].radar} cor={CORES[i % CORES.length]} rotulo={`Radar de ${j.nome_completo}`} />
          </div>
        ))}
      </div>

      {/* Tabela comparativa */}
      <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="px-4 py-3 font-medium">Comparativo</th>
              {jogadores.map((j, i) => (
                <th key={j.id} className="px-4 py-3 text-sm font-semibold normal-case">
                  <span style={{ color: CORES[i % CORES.length] }}>{j.nome_completo}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {linhas.map((linha) => (
              <tr key={linha.rotulo}>
                <td className="px-4 py-2.5 font-medium text-zinc-700 dark:text-zinc-300">
                  {linha.rotulo}
                </td>
                {linha.valores.map((v, i) => {
                  const ehMelhor = linha.melhor === i && v !== null;
                  return (
                    <td
                      key={i}
                      className={`px-4 py-2.5 ${
                        ehMelhor
                          ? "font-bold text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {v === null || v === undefined ? (
                        <span className="text-zinc-400">—</span>
                      ) : ehMelhor ? (
                        <span className="inline-flex items-center gap-1">
                          {v}
                          <span className="text-[10px] uppercase tracking-wide text-emerald-400">
                            melhor
                          </span>
                        </span>
                      ) : (
                        v
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}