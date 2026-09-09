import Link from "next/link";
import { notFound } from "next/navigation";
import DeletePlayerButton from "@/components/delete-player-button";
import { getPlayer } from "@/lib/data/players";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { calcularIdade, formatarData, formatarMoedaEUR } from "@/lib/utils";
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
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
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
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Idade"
          value={
            calcularIdade(jogador.data_nascimento) !== null
              ? `${calcularIdade(jogador.data_nascimento)} anos`
              : "—"
          }
        />
        <InfoCard
          label="Nacionalidade"
          value={jogador.nacionalidade ?? "—"}
        />
        <InfoCard
          label="Valor de mercado"
          value={formatarMoedaEUR(jogador.valor_mercado_estimado)}
        />
        <InfoCard
          label="Nota global"
          value={jogador.nota_global !== null ? jogador.nota_global.toFixed(1) : "—"}
        />
        <InfoCard
          label="Fim do contrato"
          value={formatarData(jogador.data_fim_contrato)}
        />
        <InfoCard label="Cláusula" value={formatarMoedaEUR(jogador.clausula_rescisao)} />
        <InfoCard
          label="Pé dominante"
          value={jogador.pe_dominante ?? "—"}
        />
        <InfoCard
          label="Disponibilidade"
          value={jogador.status_disponibilidade}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Temporadas
        </h2>
        {jogador.season_stats.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma estatística registrada.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-4 py-2.5 font-medium">Temporada</th>
                  <th className="px-4 py-2.5 font-medium">Jogos</th>
                  <th className="px-4 py-2.5 font-medium">Gols</th>
                  <th className="px-4 py-2.5 font-medium">Assist.</th>
                  <th className="px-4 py-2.5 font-medium">Minutos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {jogador.season_stats.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-medium">{s.temporada}</td>
                    <td className="px-4 py-2.5">{s.jogos_disputados}</td>
                    <td className="px-4 py-2.5">{s.gols_marcados}</td>
                    <td className="px-4 py-2.5">{s.assistencias}</td>
                    <td className="px-4 py-2.5">{s.minutos_jogados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Histórico de lesões
          </h2>
          {jogador.injuries.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhum registro de lesão.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {jogador.injuries.map((lesao) => (
                <li
                  key={lesao.id}
                  className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
                >
                  <p className="font-semibold">{lesao.tipo_lesao}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatarData(lesao.data_inicio)}
                    {lesao.dias_afastado !== null &&
                      ` · ${lesao.dias_afastado} dias afastado`}
                    {lesao.gravidade && ` · ${lesao.gravidade}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Avaliações de scout
          </h2>
          {jogador.evaluations.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma avaliação registrada.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {jogador.evaluations.map((av) => (
                <li
                  key={av.id}
                  className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
                >
                  <p className="font-semibold">
                    {av.scout_responsavel ?? "Scout"} ·{" "}
                    {formatarData(av.data_avaliacao)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {av.recomendacao_final ?? "Sem recomendação"}
                    {av.potencial_desenvolvimento !== null &&
                      ` · Potencial ${av.potencial_desenvolvimento}/100`}
                  </p>
                  {av.observacoes_gerais && (
                    <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                      {av.observacoes_gerais}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
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