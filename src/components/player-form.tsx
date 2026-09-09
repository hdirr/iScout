"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PES,
  Pe,
  POSICOES,
  Posicao,
  POSICAO_LABEL,
  STATUS_DISPONIBILIDADE,
  type Player,
  type PlayerInput,
} from "@/lib/types";

interface PlayerFormProps {
  player?: Player;
}

const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";

const labelCls = "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

function toNumber(value: string): number | null {
  if (value === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export default function PlayerForm({ player }: PlayerFormProps) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState<PlayerInput>({
    nome_completo: player?.nome_completo ?? "",
    nome_usual: player?.nome_usual ?? "",
    apelido: player?.apelido ?? "",
    data_nascimento: player?.data_nascimento ?? "",
    nacionalidade: player?.nacionalidade ?? "",
    segunda_nacionalidade: player?.segunda_nacionalidade ?? "",
    naturalidade: player?.naturalidade ?? "",
    altura_cm: player?.altura_cm ?? null,
    peso_kg: player?.peso_kg ?? null,
    pe_dominante: player?.pe_dominante ?? null,
    posicao_principal: player?.posicao_principal ?? "MC",
    posicoes_alternativas: player?.posicoes_alternativas ?? [],
    clube_atual: player?.clube_atual ?? "",
    liga_atual: player?.liga_atual ?? "",
    pais_clube: player?.pais_clube ?? "",
    data_inicio_contrato: player?.data_inicio_contrato ?? "",
    data_fim_contrato: player?.data_fim_contrato ?? "",
    clausula_rescisao: player?.clausula_rescisao ?? null,
    valor_mercado_estimado: player?.valor_mercado_estimado ?? null,
    empresario: player?.empresario ?? "",
    agencia: player?.agencia ?? "",
    status_disponibilidade: player?.status_disponibilidade ?? "Disponível",
    nota_global: player?.nota_global ?? null,
    foto_url: player?.foto_url ?? "",
  });

  function setField<K extends keyof PlayerInput>(key: K, value: PlayerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAlternativa(posicao: Posicao) {
    setForm((f) => ({
      ...f,
      posicoes_alternativas: f.posicoes_alternativas.includes(posicao)
        ? f.posicoes_alternativas.filter((p) => p !== posicao)
        : [...f.posicoes_alternativas, posicao],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload: PlayerInput = {
      ...form,
      altura_cm: toNumber(String(form.altura_cm ?? "")),
      peso_kg: toNumber(String(form.peso_kg ?? "")),
      clausula_rescisao: toNumber(String(form.clausula_rescisao ?? "")),
      valor_mercado_estimado: toNumber(String(form.valor_mercado_estimado ?? "")),
      nota_global: toNumber(String(form.nota_global ?? "")),
    };

    const url = player ? `/api/players/${player.id}` : "/api/players";
    const method = player ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErro(body.error ?? "Falha ao salvar jogador.");
      setSalvando(false);
      return;
    }

    router.push(`/jogadores/${body.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {erro && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {erro}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Informações Pessoais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome completo *</label>
            <input
              className={inputCls}
              required
              value={form.nome_completo}
              onChange={(e) => setField("nome_completo", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Nome usual</label>
            <input
              className={inputCls}
              value={form.nome_usual ?? ""}
              onChange={(e) => setField("nome_usual", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Apelido</label>
            <input
              className={inputCls}
              value={form.apelido ?? ""}
              onChange={(e) => setField("apelido", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Data de nascimento</label>
            <input
              className={inputCls}
              type="date"
              value={form.data_nascimento ?? ""}
              onChange={(e) => setField("data_nascimento", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Nacionalidade</label>
            <input
              className={inputCls}
              value={form.nacionalidade ?? ""}
              onChange={(e) => setField("nacionalidade", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Segunda nacionalidade</label>
            <input
              className={inputCls}
              value={form.segunda_nacionalidade ?? ""}
              onChange={(e) => setField("segunda_nacionalidade", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Naturalidade</label>
            <input
              className={inputCls}
              value={form.naturalidade ?? ""}
              onChange={(e) => setField("naturalidade", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Altura (cm)</label>
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              value={form.altura_cm ?? ""}
              onChange={(e) => setField("altura_cm", toNumber(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Peso (kg)</label>
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              value={form.peso_kg ?? ""}
              onChange={(e) => setField("peso_kg", toNumber(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Pé dominante</label>
            <select
              className={inputCls}
              value={form.pe_dominante ?? ""}
              onChange={(e) =>
                setField("pe_dominante", (e.target.value as Pe) || null)
              }
            >
              <option value="">—</option>
              {Object.values(PES).map((pe) => (
                <option key={pe} value={pe}>
                  {pe}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Posição principal *</label>
            <select
              className={inputCls}
              required
              value={form.posicao_principal}
              onChange={(e) =>
                setField("posicao_principal", e.target.value as Posicao)
              }
            >
              {Object.values(POSICOES).map((pos) => (
                <option key={pos} value={pos}>
                  {pos} — {POSICAO_LABEL[pos]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Posições alternativas</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(POSICOES).map((pos) => {
              const ativa = form.posicoes_alternativas.includes(pos);
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => toggleAlternativa(pos)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    ativa
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Clube e Contrato
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Clube atual</label>
            <input
              className={inputCls}
              value={form.clube_atual ?? ""}
              onChange={(e) => setField("clube_atual", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Liga</label>
            <input
              className={inputCls}
              value={form.liga_atual ?? ""}
              onChange={(e) => setField("liga_atual", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>País do clube</label>
            <input
              className={inputCls}
              value={form.pais_clube ?? ""}
              onChange={(e) => setField("pais_clube", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Início do contrato</label>
            <input
              className={inputCls}
              type="date"
              value={form.data_inicio_contrato ?? ""}
              onChange={(e) => setField("data_inicio_contrato", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Fim do contrato</label>
            <input
              className={inputCls}
              type="date"
              value={form.data_fim_contrato ?? ""}
              onChange={(e) => setField("data_fim_contrato", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Cláusula de rescisão (€)</label>
            <input
              className={inputCls}
              type="number"
              inputMode="numeric"
              value={form.clausula_rescisao ?? ""}
              onChange={(e) => setField("clausula_rescisao", toNumber(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Valor de mercado (€)</label>
            <input
              className={inputCls}
              type="number"
              inputMode="numeric"
              value={form.valor_mercado_estimado ?? ""}
              onChange={(e) => setField("valor_mercado_estimado", toNumber(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Empresário</label>
            <input
              className={inputCls}
              value={form.empresario ?? ""}
              onChange={(e) => setField("empresario", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Agência</label>
            <input
              className={inputCls}
              value={form.agencia ?? ""}
              onChange={(e) => setField("agencia", e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Status de disponibilidade</label>
            <select
              className={inputCls}
              value={form.status_disponibilidade}
              onChange={(e) =>
                setField(
                  "status_disponibilidade",
                  e.target.value as PlayerInput["status_disponibilidade"]
                )
              }
            >
              {Object.values(STATUS_DISPONIBILIDADE).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {salvando ? "Salvando..." : player ? "Salvar alterações" : "Criar jogador"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}