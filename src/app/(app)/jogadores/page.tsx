import Link from "next/link";
import {
  buscarJogadores,
  type OrdenarJogadores,
  type PlayerFilters,
} from "@/lib/data/players";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { calcularIdade, formatarMoedaEUR } from "@/lib/utils";
import { JogadoresFiltros } from "@/components/jogadores-filtros";
import { SelecionarComparar } from "@/components/selecionar-comparar";
import {
  PES,
  POSICOES,
  STATUS_DISPONIBILIDADE,
  type Pe,
  type Posicao,
  type StatusDisponibilidade,
} from "@/lib/types";

export const metadata = { title: "Jogadores" };

type SearchParams = Record<string, string | string[] | undefined>;

const ORDENACOES: OrdenarJogadores[] = [
  "nome_completo",
  "idade",
  "posicao_principal",
  "clube_atual",
  "nota_global",
  "valor_mercado_estimado",
];

function texto(sp: SearchParams, chave: string): string | undefined {
  const v = sp[chave];
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

function enumValor<T extends string>(
  sp: SearchParams,
  chave: string,
  valores: readonly T[]
): T | undefined {
  const v = texto(sp, chave);
  if (v === undefined) return undefined;
  return valores.includes(v as T) ? (v as T) : undefined;
}

function numero(sp: SearchParams, chave: string): number | undefined {
  const v = texto(sp, chave);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function lerFiltros(sp: SearchParams): PlayerFilters {
  const ordenarPor = enumValor(sp, "ordenarPor", ORDENACOES);
  const ordem = texto(sp, "ordem") === "desc" ? "desc" : "asc";
  const valorMin = numero(sp, "valorMin");
  const valorMax = numero(sp, "valorMax");

  return {
    busca: texto(sp, "busca"),
    posicao: enumValor(sp, "posicao", Object.values(POSICOES) as Posicao[]),
    status: enumValor(
      sp,
      "status",
      Object.values(STATUS_DISPONIBILIDADE) as StatusDisponibilidade[]
    ),
    pe: enumValor(sp, "pe", Object.values(PES) as Pe[]),
    clube: texto(sp, "clube"),
    liga: texto(sp, "liga"),
    idadeMin: numero(sp, "idadeMin"),
    idadeMax: numero(sp, "idadeMax"),
    valorMin: valorMin !== undefined ? Math.round(valorMin * 1_000_000) : undefined,
    valorMax: valorMax !== undefined ? Math.round(valorMax * 1_000_000) : undefined,
    notaMin: numero(sp, "notaMin"),
    notaMax: numero(sp, "notaMax"),
    ordenarPor,
    ordem,
  };
}

export default async function JogadoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filtros = lerFiltros(sp);
  let erro: string | null = null;
  let jogadores: Awaited<ReturnType<typeof buscarJogadores>> = [];

  if (isSupabaseConfigured()) {
    try {
      jogadores = await buscarJogadores(filtros);
    } catch (err) {
      erro = err instanceof Error ? err.message : "Erro ao carregar jogadores.";
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard de jogadores
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {erro
              ? "Não foi possível carregar a lista."
              : `${jogadores.length} jogador(es) encontrados`}
          </p>
        </div>
        <Link
          href="/jogadores/novo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + Novo jogador
        </Link>
      </div>

      <div className="mt-6">
        <JogadoresFiltros valores={filtros} />
      </div>

      {!isSupabaseConfigured() && <SetupPending />}
      {erro && <ErroMensagem mensagem={erro} />}

      {isSupabaseConfigured() && !erro && jogadores.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            Nenhum jogador corresponde aos filtros.
          </p>
          <Link
            href="/jogadores"
            className="mt-3 inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Limpar filtros
          </Link>
        </div>
      )}

      {isSupabaseConfigured() && !erro && jogadores.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Jogador</th>
                <th className="px-4 py-3 font-medium">Posição</th>
                <th className="px-4 py-3 font-medium">Clube / Liga</th>
                <th className="px-4 py-3 font-medium">Temporada</th>
                <th className="px-4 py-3 font-medium">Gols · Assist</th>
                <th className="px-4 py-3 font-medium">Dias afastado</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Nota</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {jogadores.map((j) => {
                const t = j.ultima_temporada;
                const idade = calcularIdade(j.data_nascimento);
                const auxiliar = j.nome_usual || j.apelido;
                return (
                  <tr
                    key={j.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {j.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={j.foto_url}
                            alt={j.nome_completo}
                            className="h-10 w-10 shrink-0 rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {j.nome_completo.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <Link
                            href={`/jogadores/${j.id}`}
                            className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                          >
                            {j.nome_completo}
                          </Link>
                          {(auxiliar || idade !== null) && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {[auxiliar, idade !== null ? `${idade} anos` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {j.posicao_principal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      <p>{j.clube_atual ?? "—"}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {j.liga_atual ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {t ? (
                        <>
                          <p>{t.temporada}</p>
                          <p className="text-xs text-zinc-500">
                            {t.jogos_disputados} jogos
                          </p>
                        </>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {t ? (
                        <>
                          <p className="font-semibold">{t.gols_marcados}</p>
                          <p className="text-xs text-zinc-500">
                            {t.assistencias} assist.
                          </p>
                        </>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {j.total_lesoes > 0 ? (
                        <>
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {j.max_dias_afastado} dias
                          </p>
                          <p className="text-xs text-zinc-500">
                            {j.total_lesoes} lesão(ões)
                          </p>
                        </>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {formatarMoedaEUR(j.valor_mercado_estimado)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {j.nota_global !== null ? (
                        j.nota_global.toFixed(1)
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {j.status_disponibilidade}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <SelecionarComparar
            jogadores={jogadores.map((j) => ({ id: j.id, nome: j.nome_completo }))}
          />
        </>
      )}
    </div>
  );
}

function ErroMensagem({ mensagem }: { mensagem: string }) {
  return (
    <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {mensagem}
    </div>
  );
}

function SetupPending() {
  return (
    <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-5 py-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <h2 className="font-semibold">Supabase não configurado</h2>
      <p className="mt-1 text-amber-700 dark:text-amber-300">
        Para listar jogadores, crie um projeto em{" "}
        <span className="font-mono">supabase.com</span>, rode o schema em{" "}
        <span className="font-mono">supabase/schema.sql</span> e preencha as
        variáveis em <span className="font-mono">.env.local</span>.
      </p>
    </div>
  );
}