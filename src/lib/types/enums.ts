export const PES = {
  DESTRO: "Destro",
  CANHOTO: "Canhoto",
  AMBIDESTRO: "Ambidestro",
} as const;
export type Pe = (typeof PES)[keyof typeof PES];

export const POSICOES = {
  GOL: "GOL",
  ZAG: "ZAG",
  ZAE: "ZAE",
  ZAD: "ZAD",
  LAT: "LAT",
  LAE: "LAE",
  LAD: "LAD",
  SA: "SA",
  CA: "CA",
  VOL: "VOL",
  MC: "MC",
  MEC: "MEC",
  MED: "MED",
  MEI: "MEI",
  PON: "PON",
  PEE: "PEE",
  PED: "PED",
  CF: "CF",
} as const;
export type Posicao = (typeof POSICOES)[keyof typeof POSICOES];

export const POSICAO_LABEL: Record<Posicao, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro Central",
  ZAE: "Zagueiro Esquerdo",
  ZAD: "Zagueiro Direito",
  LAT: "Lateral",
  LAE: "Lateral Esquerdo",
  LAD: "Lateral Direito",
  SA: "Segundo Atacante",
  CA: "Centroavante",
  VOL: "Volante",
  MC: "Meio-campista Central",
  MEC: "Meio-campista Esquerdo",
  MED: "Meio-campista Direito",
  MEI: "Meio-campista Ofensivo",
  PON: "Ponta",
  PEE: "Ponta Esquerda",
  PED: "Ponta Direita",
  CF: "Atacante Central",
};

export const STATUS_DISPONIBILIDADE = {
  DISPONIVEL: "Disponível",
  EM_NEGOCIACAO: "Em negociação",
  ACERTADO: "Acertado com outro clube",
  INDISPONIVEL: "Indisponível",
} as const;
export type StatusDisponibilidade =
  (typeof STATUS_DISPONIBILIDADE)[keyof typeof STATUS_DISPONIBILIDADE];

export const TIPO_LESAO = {
  MUSCULAR: "Muscular",
  LIGAMENTO: "Ligamento",
  OSSO: "Osso",
  TENDAO: "Tendão",
  CARTILAGEM: "Cartilagem",
  CONCUSSAO: "Concussão",
  CIRURGIA: "Cirurgia",
  OUTRO: "Outro",
} as const;
export type TipoLesao = (typeof TIPO_LESAO)[keyof typeof TIPO_LESAO];

export const LOCALIZACAO_LESAO = {
  COXA: "Coxa",
  PANTURRILHA: "Panturrilha",
  JOELHO: "Joelho",
  TORNOZELO: "Tornozelo",
  PE: "Pé",
  QUADRIL: "Quadril",
  VIRILHA: "Virilha",
  COSTAS: "Costas",
  OMBRO: "Ombro",
  MAO_BRACO: "Mão/Braço",
  CABECA: "Cabeça",
} as const;
export type LocalizacaoLesao = (typeof LOCALIZACAO_LESAO)[keyof typeof LOCALIZACAO_LESAO];

export const LADO_LESAO = {
  ESQUERDO: "Esquerdo",
  DIREITO: "Direito",
  AMBOS: "Ambos",
} as const;
export type LadoLesao = (typeof LADO_LESAO)[keyof typeof LADO_LESAO];

export const GRAVIDADE_LESAO = {
  PEQUENA: "Pequena (<7 dias)",
  MODERADA: "Moderada (7-28 dias)",
  SEVERA: "Severa (28-84 dias)",
  MUITO_SEVERA: "Muito Severa (>84 dias)",
} as const;
export type GravidadeLesao = (typeof GRAVIDADE_LESAO)[keyof typeof GRAVIDADE_LESAO];

export const CAUSA_LESAO = {
  CONTATO: "Contato",
  MUSCULAR_SEM_CONTATO: "Muscular sem contato",
  SOBRECARGA: "Sobrecarga",
  RECIDIVA: "Recidiva",
  ACIDENTE_TREINO: "Acidente de treino",
} as const;
export type CausaLesao = (typeof CAUSA_LESAO)[keyof typeof CAUSA_LESAO];

export const RISCO_LESAO = {
  BAIXO: "Baixo risco",
  MEDIO: "Médio risco",
  ALTO: "Alto risco",
  MUITO_ALTO: "Muito alto risco",
} as const;
export type RiscoLesao = (typeof RISCO_LESAO)[keyof typeof RISCO_LESAO];