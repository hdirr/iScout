import Link from "next/link";
import { notFound } from "next/navigation";
import DeletePlayerButton from "@/components/delete-player-button";
import ImprimirRelatorio from "@/components/imprimir-relatorio";
import JogadorRelatorio from "@/components/jogador-relatorio";
import { getPlayer } from "@/lib/data/players";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { calcularIdade } from "@/lib/utils";
import { POSICAO_LABEL } from "@/lib/types";

export default async function JogadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Supabase não configurado. Preencha as variáveis em{" "}
          <span className="font-mono">.env.local</span>.
        </div>
      </div>
    );
  }

  const jogador = await getPlayer(id).catch(() => null);
  if (!jogador) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 print:px-0 print:py-4">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-2xl font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {iniciais(jogador.nome_completo)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {jogador.nome_completo}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {POSICAO_LABEL[jogador.posicao_principal]} ·{" "}
              {jogador.clube_atual ?? "Sem clube"}
              {jogador.liga_atual && ` · ${jogador.liga_atual}`}
              {calcularIdade(jogador.data_nascimento) !== null &&
                ` · ${calcularIdade(jogador.data_nascimento)} anos`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ImprimirRelatorio />
          <Link
            href={`/jogadores/${jogador.id}/editar`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Editar
          </Link>
          <DeletePlayerButton
            playerId={jogador.id}
            playerName={jogador.nome_completo}
          />
        </div>
      </div>

      <JogadorRelatorio jogador={jogador} />
    </div>
  );
}

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}