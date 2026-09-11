import {
  formatarData,
  formatarMinutos,
  formatarMoedaEUR,
} from "@/lib/utils";
import {
  montarRelatorio,
  type TemporadaEvolucao,
} from "@/lib/reporte";
import type { PlayerWithStats } from "@/lib/types";
import { POSICAO_LABEL } from "@/lib/types";
import { RadarChart } from "@/components/radar-grafico";

const COR_RISCO: Record<string, string> = {
  Baixo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  Médio: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Alto: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

const COR_ASPECTO: Record<string, string> = {
  "Técnica": "#38bdf8",
  "Física": "#fb923c",
  "Comportamental": "#a78bfa",
};

export default function JogadorRelatorio({ jogador }: { jogador: PlayerWithStats }) {
  const rel = montarRelatorio(jogador);

  return (
    <div className="mt-8 space-y-10">
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">{jogador.nome_completo}</h1>
        <p className="text-sm text-zinc-500">
          {POSICAO_LABEL[jogador.posicao_principal]} · {jogador.clube_atual ?? "Sem clube"}
          {jogador.liga_atual && ` · ${jogador.liga_atual}`}
        </p>
        <p className="text-xs text-zinc-400">Relatório gerado em {formatarData(rel.geradoEm)}</p>
      </div>

      {/* 1. Resumo executivo */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Resumo executivo
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ResumoCard label="Nota global" valor={rel.resumo.nota !== null ? `${rel.resumo.nota.toFixed(1)}/100` : "—"} destaque />
          <ResumoCard label="Potencial" valor={rel.resumo.potencial !== null ? `${rel.resumo.potencial}/100` : "—"} />
          <ResumoCard label="Idade" valor={rel.resumo.idade !== null ? `${rel.resumo.idade} anos` : "—"} />
          <ResumoCard
            label="Risco de lesão"
            valor={rel.resumo.risco_lesao}
            badge={COR_RISCO[rel.resumo.risco_lesao]}
            dica={rel.resumo.risco_detalhe}
          />
        </div>
      </section>

      {/* 2. Radar + Evolução */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Perfil (radar)
          </h2>
          {rel.radar.some((e) => e.valor !== null) ? (
            <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <RadarChart eixos={rel.radar} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Sem avaliação do scout para montar o radar.
            </p>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Evolução de temporadas
          </h2>
          {rel.evolucao.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma estatística registrada.
            </p>
          ) : (
            <>
              <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="mb-2 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Gols
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Assistências
                  </span>
                </div>
                <EvolucaoChart evolucao={rel.evolucao} />
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <th className="px-3 py-2 font-medium">Temporada</th>
                      <th className="px-3 py-2 font-medium">Jogos</th>
                      <th className="px-3 py-2 font-medium">Min</th>
                      <th className="px-3 py-2 font-medium">Gols</th>
                      <th className="px-3 py-2 font-medium">Assist</th>
                      <th className="px-3 py-2 font-medium">G+A/90</th>
                      <th className="px-3 py-2 font-medium">% Passes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {rel.evolucao.map((t) => (
                      <tr key={t.temporada}>
                        <td className="px-3 py-2 font-medium">{t.temporada}</td>
                        <td className="px-3 py-2">{t.jogos}</td>
                        <td className="px-3 py-2">{formatarMinutos(t.minutos)}</td>
                        <td className="px-3 py-2">{t.gols}</td>
                        <td className="px-3 py-2">{t.assistencias}</td>
                        <td className="px-3 py-2">{t.ga_por_90 ?? "—"}</td>
                        <td className="px-3 py-2">{t.precisao_passes !== null ? `${t.precisao_passes}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3. Análise detalhada */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Análise detalhada
        </h2>
        {rel.analise.every((a) => a.itens.length === 0) ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sem avaliação qualitativa registrada.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            {rel.analise.map((a) => (
              <div
                key={a.rotulo}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{a.rotulo}</h3>
                  {a.media !== null && (
                    <span className="text-sm font-bold">{a.media}/100</span>
                  )}
                </div>
                <ul className="mt-3 space-y-2.5">
                  {a.itens.map((it) => (
                    <li key={it.chave}>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-300">{it.rotulo}</span>
                        <span className="font-medium">{it.valor}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(100, it.valor))}%`,
                            backgroundColor: COR_ASPECTO[a.rotulo] ?? "#38bdf8",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Lesões */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Histórico de lesões
        </h2>
        {jogador.injuries.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum registro de lesão.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-3 py-2 font-medium">Início</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Local</th>
                  <th className="px-3 py-2 font-medium">Gravidade</th>
                  <th className="px-3 py-2 font-medium">Dias</th>
                  <th className="px-3 py-2 font-medium">Recidiva</th>
                  <th className="px-3 py-2 font-medium">Cirurgia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {jogador.injuries.map((l) => (
                  <tr key={l.id}>
                    <td className="px-3 py-2">{formatarData(l.data_inicio)}</td>
                    <td className="px-3 py-2 font-medium">{l.tipo_lesao}</td>
                    <td className="px-3 py-2">{l.localizacao ?? "—"}</td>
                    <td className="px-3 py-2">{l.gravidade ?? "—"}</td>
                    <td className="px-3 py-2">{l.dias_afastado ?? "—"}</td>
                    <td className="px-3 py-2">{l.recidiva ? "Sim" : "Não"}</td>
                    <td className="px-3 py-2">{l.cirurgia_realizada ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Mercado */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Análise de mercado
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ResumoCard label="Valor de mercado" valor={formatarMoedaEUR(rel.mercado.valor_mercado)} />
          <ResumoCard label="Cláusula de rescisão" valor={formatarMoedaEUR(rel.mercado.clausula)} />
          <ResumoCard
            label="Fim do contrato"
            valor={formatarData(rel.mercado.fim_contrato)}
          />
          <ResumoCard
            label="Potencial de mercado"
            valor={rel.mercado.potencial_de_mercado ?? "—"}
          />
        </div>
      </section>

      {/* 6. Observações + pontos de atenção */}
      {(
        rel.observacoes ||
        rel.pontos_atencao
      ) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {rel.observacoes && (
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Observações do scout
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {rel.observacoes}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
              Pontos de atenção
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-indigo-900 dark:text-indigo-100">
              {rel.pontos_atencao || "Sem pontos de atenção a destacar."}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function ResumoCard({
  label,
  valor,
  badge,
  badgeTexto,
  dica,
  destaque = false,
}: {
  label: string;
  valor: string;
  badge?: string | null;
  badgeTexto?: string | null;
  dica?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-4 " +
        (destaque
          ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/30"
          : "border-zinc-200 dark:border-zinc-800")
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <p className={"font-semibold " + (destaque ? "text-xl" : "")}>{valor}</p>
        {badge && badgeTexto && (
          <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + badge}>
            {badgeTexto}
          </span>
        )}
      </div>
      {dica && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{dica}</p>}
    </div>
  );
}

function EvolucaoChart({ evolucao }: { evolucao: TemporadaEvolucao[] }) {
  if (!evolucao.length) return null;
  const max = Math.max(1, ...evolucao.map((e) => Math.max(e.gols, e.assistencias)));
  const barW = 14;
  const gap = 6;
  const groupW = barW * 2 + gap;
  const padX = 16;
  const top = 6;
  const lblH = 20;
  const H = 132;
  const W = Math.max(180, padX * 2 + evolucao.length * groupW);
  const plotH = H - lblH - top;
  const scale = plotH / max;
  const base = top + plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de gols e assistências por temporada">
      <line x1={padX - 4} y1={base} x2={W - padX + 4} y2={base} stroke="currentColor" strokeOpacity="0.2" />
      {evolucao.map((e, i) => {
        const x0 = padX + i * groupW;
        const hg = Math.max(0, Math.round(e.gols * scale));
        const ha = Math.max(0, Math.round(e.assistencias * scale));
        return (
          <g key={e.temporada}>
            <rect x={x0} y={base - hg} width={barW} height={hg} rx={2} fill="#10b981" />
            <rect x={x0 + barW + gap} y={base - ha} width={barW} height={ha} rx={2} fill="#38bdf8" />
            <text
              x={x0 + barW / 2}
              y={base - hg - 3}
              textAnchor="middle"
              fontSize={9}
              fill="#10b981"
            >
              {e.gols}
            </text>
            <text
              x={x0 + barW + gap + barW / 2}
              y={base - ha - 3}
              textAnchor="middle"
              fontSize={9}
              fill="#38bdf8"
            >
              {e.assistencias}
            </text>
            <text
              x={x0 + groupW / 2}
              y={base + 14}
              textAnchor="middle"
              fontSize={10}
              fill="#71717a"
            >
              {e.temporada}
            </text>
          </g>
        );
      })}
    </svg>
  );
}