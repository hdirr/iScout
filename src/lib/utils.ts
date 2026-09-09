export function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export function formatarMoedaEUR(valor: number | null): string {
  if (valor === null || valor === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatarData(data: string | null): string {
  if (!data) return "—";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleDateString("pt-BR");
}

export function formatarMinutos(minutos: number | null): string {
  if (minutos === null || minutos === undefined) return "—";
  const horas = Math.floor(minutos / 60);
  const min = minutos % 60;
  return `${horas}h ${min}min`;
}

export function percentual(
  parte: number | null | undefined,
  total: number | null | undefined
): number | null {
  if (parte === null || parte === undefined || !total) return null;
  return Math.round((parte / total) * 1000) / 10;
}