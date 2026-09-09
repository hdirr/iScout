import Link from "next/link";
import type { Posicao } from "@/lib/types";
import { type PlayerFilters } from "@/lib/data/players";
import {
  GRAVIDADE_LESAO,
  PES,
  POSICAO_LABEL,
  POSICOES,
  RECOMENDACAO,
  STATUS_DISPONIBILIDADE,
  TIPO_LESAO,
} from "@/lib/types";

const inputClasse =
  "rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const selectClasse = `${inputClasse} pr-7`;

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {titulo}
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </fieldset>
  );
}

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
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {rotulo}
      </span>
      <select name={nome} defaultValue={valor ?? ""} className={selectClasse}>
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

function CampoTexto({
  nome,
  rotulo,
  valor,
  placeholder,
}: {
  nome: string;
  rotulo: string;
  valor: string | undefined;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {rotulo}
      </span>
      <input
        name={nome}
        type="text"
        defaultValue={valor ?? ""}
        placeholder={placeholder}
        className={inputClasse}
      />
    </label>
  );
}

function CampoNumero({
  nome,
  rotulo,
  valor,
  passo = "any",
}: {
  nome: string;
  rotulo: string;
  valor: number | undefined;
  passo?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {rotulo}
      </span>
      <input
        name={nome}
        type="number"
        step={passo}
        defaultValue={valor ?? ""}
        placeholder="—"
        className={inputClasse}
      />
    </label>
  );
}

function Faixa({
  nomeMin,
  nomeMax,
  rotulo,
  minimo,
  maximo,
  passo = "any",
}: {
  nomeMin: string;
  nomeMax: string;
  rotulo: string;
  minimo?: number;
  maximo?: number;
  passo?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {rotulo}
      </span>
      <div className="flex items-center gap-2">
        <input
          name={nomeMin}
          type="number"
          step={passo}
          defaultValue={minimo ?? ""}
          placeholder="Mín."
          className={inputClasse}
        />
        <span className="text-zinc-400">–</span>
        <input
          name={nomeMax}
          type="number"
          step={passo}
          defaultValue={maximo ?? ""}
          placeholder="Máx."
          className={inputClasse}
        />
      </div>
    </div>
  );
}

function FaixaData({
  nomeDe,
  nomeAte,
  rotulo,
  de,
  ate,
}: {
  nomeDe: string;
  nomeAte: string;
  rotulo: string;
  de?: string;
  ate?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {rotulo}
      </span>
      <div className="flex items-center gap-2">
        <input name={nomeDe} type="date" defaultValue={de ?? ""} className={inputClasse} />
        <span className="text-zinc-400">–</span>
        <input name={nomeAte} type="date" defaultValue={ate ?? ""} className={inputClasse} />
      </div>
    </div>
  );
}

export function JogadoresFiltros({ valores }: { valores: PlayerFilters }) {
  const str = (v?: string) => (v === undefined ? undefined : v);
  const bool = (v?: boolean) =>
    v === undefined ? undefined : String(v);

  return (
    <form
      method="get"
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Buscar jogador
          </span>
          <input
            name="busca"
            type="text"
            defaultValue={valores.busca ?? ""}
            placeholder="Nome, nome usual ou apelido…"
            className={inputClasse}
          />
        </label>
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Ordenar por
            </span>
            <select
              name="ordenarPor"
              defaultValue={valores.ordenarPor ?? "nome_completo"}
              className={selectClasse}
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
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Ordem
            </span>
            <select
              name="ordem"
              defaultValue={valores.ordem ?? "asc"}
              className={selectClasse}
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </label>
          <Link
            href="/jogadores"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Limpar
          </Link>
        </div>
      </div>

      <Grupo titulo="Jogador">
        <CampoSelect
          nome="posicao"
          rotulo="Posição"
          valor={valores.posicao}
          opcoes={POSICOES}
          rotuloOpcao={(v) => `${v} — ${POSICAO_LABEL[v as Posicao]}`}
        />
        <CampoSelect nome="pe" rotulo="Pé dominante" valor={str(valores.pe)} opcoes={PES} />
        <CampoTexto nome="nacionalidade" rotulo="Nacionalidade" valor={valores.nacionalidade ?? ""} placeholder="Ex: Brasil" />
        <Faixa nomeMin="idadeMin" nomeMax="idadeMax" rotulo="Idade (anos)" minimo={valores.idadeMin} maximo={valores.idadeMax} passo="1" />
        <Faixa nomeMin="alturaMin" nomeMax="alturaMax" rotulo="Altura (cm)" minimo={valores.alturaMin} maximo={valores.alturaMax} passo="1" />
        <Faixa nomeMin="pesoMin" nomeMax="pesoMax" rotulo="Peso (kg)" minimo={valores.pesoMin} maximo={valores.pesoMax} passo="1" />
      </Grupo>

      <Grupo titulo="Clube e contrato">
        <CampoTexto nome="clube" rotulo="Clube atual" valor={valores.clube ?? ""} placeholder="Ex: Flamengo" />
        <CampoTexto nome="liga" rotulo="Liga" valor={valores.liga ?? ""} placeholder="Ex: Brasileirão" />
        <CampoTexto nome="pais" rotulo="País do clube" valor={valores.pais ?? ""} placeholder="Ex: Brasil" />
        <FaixaData nomeDe="fimContratoDe" nomeAte="fimContratoAte" rotulo="Fim do contrato" de={valores.fimContratoDe} ate={valores.fimContratoAte} />
      </Grupo>

      <Grupo titulo="Mercado">
        <Faixa nomeMin="valorMin" nomeMax="valorMax" rotulo="Valor de mercado (€)" minimo={valores.valorMin} maximo={valores.valorMax} passo="1" />
        <CampoSelect nome="status" rotulo="Disponibilidade" valor={str(valores.status)} opcoes={STATUS_DISPONIBILIDADE} />
      </Grupo>

      <Grupo titulo="Desempenho (última temporada)">
        <Faixa nomeMin="golsMin" nomeMax="golsMax" rotulo="Gols" minimo={valores.golsMin} maximo={valores.golsMax} passo="1" />
        <Faixa nomeMin="assistMin" nomeMax="assistMax" rotulo="Assistências" minimo={valores.assistMin} maximo={valores.assistMax} passo="1" />
        <Faixa nomeMin="xgMin" nomeMax="xgMax" rotulo="xG" minimo={valores.xgMin} maximo={valores.xgMax} />
        <Faixa nomeMin="xaMin" nomeMax="xaMax" rotulo="xA" minimo={valores.xaMin} maximo={valores.xaMax} />
        <Faixa nomeMin="desarmesMin" nomeMax="desarmesMax" rotulo="Desarmes" minimo={valores.desarmesMin} maximo={valores.desarmesMax} passo="1" />
        <Faixa nomeMin="precisaoPassesMin" nomeMax="precisaoPassesMax" rotulo="Precisão de passes (%)" minimo={valores.precisaoPassesMin} maximo={valores.precisaoPassesMax} passo="0.1" />
        <Faixa nomeMin="notaMin" nomeMax="notaMax" rotulo="Nota global (0-100)" minimo={valores.notaMin} maximo={valores.notaMax} passo="0.1" />
        <CampoNumero nome="minJogos" rotulo="Mín. jogos na temporada" valor={valores.minJogos} passo="1" />
      </Grupo>

      <Grupo titulo="Lesões">
        <CampoNumero nome="maxDiasAfastado" rotulo="Máx. dias afastado" valor={valores.maxDiasAfastado} passo="1" />
        <CampoSelect nome="tipoLesao" rotulo="Tipo de lesão" valor={str(valores.tipoLesao)} opcoes={TIPO_LESAO} />
        <CampoSelect nome="gravidade" rotulo="Gravidade" valor={str(valores.gravidade)} opcoes={GRAVIDADE_LESAO} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Recidiva
          </span>
          <select
            name="recidiva"
            defaultValue={bool(valores.recidiva)}
            className={selectClasse}
          >
            <option value="">Tanto faz</option>
            <option value="true">Com recidiva</option>
            <option value="false">Sem recidiva</option>
          </select>
        </label>
      </Grupo>

      <Grupo titulo="Avaliação do scout (última)">
        <CampoSelect nome="recomendacao" rotulo="Recomendação final" valor={str(valores.recomendacao)} opcoes={RECOMENDACAO} />
        <CampoTexto nome="scout" rotulo="Scout responsável" valor={valores.scout ?? ""} placeholder="Ex: João" />
        <Faixa nomeMin="potencialMin" nomeMax="potencialMax" rotulo="Potencial (0-100)" minimo={valores.potencialMin} maximo={valores.potencialMax} passo="0.1" />
        <FaixaData nomeDe="avaliadoDe" nomeAte="avaliadoAte" rotulo="Data da avaliação" de={valores.avaliadoDe} ate={valores.avaliadoAte} />
      </Grupo>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Aplicar filtros
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Desempenho usa a última temporada; scout, a última avaliação.
        </span>
      </div>
    </form>
  );
}