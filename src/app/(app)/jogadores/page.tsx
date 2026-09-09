import Link from "next/link";
import { getPlayers } from "@/lib/data/players";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { calcularIdade, formatarMoedaEUR } from "@/lib/utils";
import {
  POSICOES,
  POSICAO_LABEL,
  type Player,
  type Posicao,
} from "@/lib/types";

export const metadata = { title: "Jogadores" };

export default async function JogadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ posicao?: string }>;
}) {
  const { posicao } = await searchParams;
  const posicaoValida = Object.values(POSICOES).includes(posicao as Posicao)
    ? (posicao as Posicao)
    : undefined;

  let jogadores: Player[] = [];
  let erro: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      jogadores = await getPlayers({
        posicao: posicaoValida,
        ordenarPor: "nome_completo",
      });
    } catch (err) {
      erro = err instanceof Error ? err.message : "Erro ao carregar jogadores.";
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jogadores</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {erro
              ? "Não foi possível carregar a lista."
              : `${jogadores.length} jogador(es) no banco`}
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <select
            name="posicao"
            defaultValue={posicaoValida ?? ""}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">Todas as posições</option>
            {Object.values(POSICOES).map((pos) => (
              <option key={pos} value={pos}>
                {pos} — {POSICAO_LABEL[pos]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Filtrar
          </button>
          {posicaoValida && (
            <Link
              href="/jogadores"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Limpar
            </Link>
          )}
        </form>
      </div>

      {!isSupabaseConfigured() && <SetupPending />}
      {erro && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {erro}
        </div>
      )}

      {isSupabaseConfigured() && !erro && jogadores.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            Nenhum jogador cadastrado ainda.
          </p>
          <Link
            href="/jogadores/novo"
            className="mt-3 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Cadastrar o primeiro jogador
          </Link>
        </div>
      )}

      {isSupabaseConfigured() && !erro && jogadores.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Jogador</th>
                <th className="px-4 py-3 font-medium">Posição</th>
                <th className="px-4 py-3 font-medium">Clube / Liga</th>
                <th className="px-4 py-3 font-medium">Valor de mercado</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {jogadores.map((j) => (
                <tr
                  key={j.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/jogadores/${j.id}`}
                      className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {j.nome_completo}
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {j.nome_usual || j.apelido}
                      {calcularIdade(j.data_nascimento) !== null && (
                        <span> · {calcularIdade(j.data_nascimento)} anos</span>
                      )}
                    </p>
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
                    {formatarMoedaEUR(j.valor_mercado_estimado)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {j.status_disponibilidade}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {j.nota_global !== null ? (
                      j.nota_global.toFixed(1)
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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