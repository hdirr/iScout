"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MAX = 3;

export function SelecionarComparar({
  jogadores,
}: {
  jogadores: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [filtro, setFiltro] = useState("");

  const visiveis = useMemo(() => {
    const termo = filtro
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return jogadores.filter((j) => {
      const nome = j.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return nome.includes(termo);
    });
  }, [jogadores, filtro]);

  function alternar(id: string) {
    setSelecionados((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      if (atual.length >= MAX) return atual;
      return [...atual, id];
    });
  }

  function comparar() {
    if (selecionados.length < 2) return;
    router.push(`/comparar?ids=${selecionados.join(",")}`);
  }

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Comparar jogadores</h2>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar por nome…"
            className="h-9 w-52 rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={comparar}
            disabled={selecionados.length < 2}
            className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:disabled:bg-zinc-700"
          >
            Comparar {selecionados.length > 0 ? `(${selecionados.length})` : ""}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Selecione {MAX} jogadores ({selecionados.length}/{MAX} escolhidos).
      </p>
      {visiveis.length > 0 ? (
        <ul className="mt-3 grid max-h-56 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((j) => {
            const marcado = selecionados.includes(j.id);
            const bloqueado = selecionados.length >= MAX && !marcado;
            return (
              <li key={j.id}>
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    marcado
                      ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  } ${bloqueado ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    disabled={bloqueado}
                    onChange={() => alternar(j.id)}
                    className="h-4 w-4 accent-zinc-900"
                  />
                  <span className="truncate">{j.nome}</span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Nenhum jogador nos resultados atuais.
        </p>
      )}
    </div>
  );
}