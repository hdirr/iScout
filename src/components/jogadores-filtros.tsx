import Link from "next/link";
import type { PlayerFilters } from "@/lib/data/players";
import {
  POSICAO_LABEL,
  POSICOES,
  RECOMENDACAO,
  STATUS_DISPONIBILIDADE,
  type Posicao,
} from "@/lib/types";

const controleClasse =
  "h-10 rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:[color-scheme:dark]";

const rotuloClasse =
  "text-xs font-medium text-zinc-600 dark:text-zinc-400";

function CampoSelect({
  nome,
  rotulo,
  valor,
  opcoes,
  rotuloOpcao,
}: {
  nome: string;
  rotulo: string;
  valor: string | undefined;
  opcoes: Record<string, string>;
  rotuloOpcao?: (valor: string) => string;
}) {
  return (
    <label className="flex min-w-[150px] flex-1 flex-col gap-1">
      <span className={rotuloClasse}>{rotulo}</span>
      <select name={nome} defaultValue={valor ?? ""} className={controleClasse}>
        <option value="">Todos</option>
        {Object.values(opcoes).map((v) => (
          <option key={v} value={v}>
            {rotuloOpcao ? rotuloOpcao(v) : v}
          </option>
        ))}
      </select>
    </label>
  );
}

export function JogadoresFiltros({ valores }: { valores: PlayerFilters }) {
  return (
    <form
      method="get"
      className="rounded-xl border border-zinc-200 p-4 sm:p-5 dark:border-zinc-800"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="flex min-w-[240px] flex-1 flex-col gap-1">
          <span className={rotuloClasse}>Buscar jogador ou time</span>
          <input
            name="busca"
            type="search"
            defaultValue={valores.busca ?? ""}
            placeholder="Ex.: Flamengo, Pedro, Arrascaeta…"
            className={`${controleClasse} px-3`}
          />
        </label>

        <CampoSelect
          nome="posicao"
          rotulo="Posição"
          valor={valores.posicao}
          opcoes={POSICOES}
          rotuloOpcao={(v) => `${v} — ${POSICAO_LABEL[v as Posicao]}`}
        />

        <CampoSelect
          nome="status"
          rotulo="Disponibilidade"
          valor={valores.status}
          opcoes={STATUS_DISPONIBILIDADE}
        />

        <CampoSelect
          nome="recomendacao"
          rotulo="Recomendação do scout"
          valor={valores.recomendacao}
          opcoes={RECOMENDACAO}
        />

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Buscar
          </button>
          <Link
            href="/jogadores"
            className="flex h-10 items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Limpar
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className={rotuloClasse}>Ordenar por</span>
            <select
              name="ordenarPor"
              defaultValue={valores.ordenarPor ?? "nome_completo"}
              className={controleClasse}
            >
              <option value="nome_completo">Nome</option>
              <option value="idade">Idade</option>
              <option value="posicao_principal">Posição</option>
              <option value="clube_atual">Clube</option>
              <option value="nota_global">Nota</option>
              <option value="valor_mercado_estimado">Valor de mercado</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={rotuloClasse}>Ordem</span>
            <select
              name="ordem"
              defaultValue={valores.ordem ?? "asc"}
              className={controleClasse}
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Gols/assistências e recomendação vêm dos últimos registros. Clique no
          jogador para abrir a ficha completa.
        </p>
      </div>
    </form>
  );
}