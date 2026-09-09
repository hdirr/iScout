# ⚽ App de Scout de Jogadores

**Especificação Técnica Completa para Desenvolvimento**

| | |
|---|---|
| **Versão** | 1.0 |
| **Data** | 08/09/2026 |
| **Autor** | Agadir |

---

## 📑 Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Modelo de Dados](#2-modelo-de-dados)
3. [Análise de Temporadas - Evolução e Projeção](#3-análise-de-temporadas---evolução-e-projeção)
4. [Avaliação Qualitativa (Scout Manual)](#4-avaliação-qualitativa-scout-manual)
5. [Adaptação e Contexto de Ligas](#5-adaptação-e-contexto-de-ligas)
6. [Análise de Mercado e Custo-Benefício](#6-análise-de-mercado-e-custo-benefício)
7. [Filtros e Sistema de Busca Avançada](#7-filtros-e-sistema-de-busca-avançada)
8. [Relatório do Jogador - Visão Única](#8-relatório-do-jogador---visão-única)
9. [Sistema de Compatibilidade (Fit)](#9-sistema-de-compatibilidade-fit)
10. [Alertas Inteligentes](#10-alertas-inteligentes)
11. [APIs e Fontes de Dados](#11-apis-e-fontes-de-dados)
12. [Tecnologias Sugeridas](#12-tecnologias-sugeridas)

---

## 1. Visão Geral do Projeto

### 1.1 Objetivo Estratégico

Desenvolver uma plataforma web de scouting profissional focada em **mercados emergentes e menos explorados**, identificando talentos com alto potencial de valorização e custo-benefício.

### 1.2 Mercados-Alvo

- **🌎 América do Sul:** Brasil, Argentina, Uruguai, Colômbia, Chile, Equador, Paraguai, Peru
- **🌎 América do Norte:** MLS (EUA), Liga MX (México), Canadian Premier League
- **🌍 África:** Nigéria, Costa do Marfim, Senegal, Gana, Camarões, Egito, África do Sul
- **🇪🇺 Europa de Menor Relevância:** Portugal, Holanda, Bélgica, Turquia, Grécia, Ucrânia, Rússia, Croácia, Sérvia

### 1.3 Público-Alvo

| Perfil | Papel |
|---|---|
| Diretor Esportivo | Decisões estratégicas |
| Olheiros (Scouts) | Coleta de dados em campo |
| Analistas de Desempenho | Análise de dados e métricas |

### 1.4 Diferencial Competitivo

- Foco em mercados com **alto potencial de valorização**
- Análise **completa e integrada** (performance, lesões, mercado)
- Sistema de **compatibilidade tática** com o estilo do clube
- **Alertas inteligentes** sobre oportunidades de mercado

---

## 2. Modelo de Dados

### 2.1 Informações Pessoais e Contratuais

```json
{
  "jogador_id": "UUID",
  "nome_completo": "string",
  "nome_usual": "string",
  "apelido": "string",
  "data_nascimento": "date",
  "idade": "number (calculado)",
  "nacionalidade": "string",
  "segunda_nacionalidade": "string",
  "naturalidade": "string",
  "altura_cm": "number",
  "peso_kg": "number",
  "pe_dominante": "enum['Destro', 'Canhoto', 'Ambidestro']",
  "posicao_principal": "enum[ver lista de posições]",
  "posicoes_alternativas": "array[enum]",
  "clube_atual": "string",
  "liga_atual": "string",
  "pais_clube": "string",
  "data_inicio_contrato": "date",
  "data_fim_contrato": "date",
  "tempo_restante_contrato": "string (calculado)",
  "clausula_rescisao": "number (€)",
  "valor_mercado_estimado": "number (€)",
  "empresario": "string",
  "agencia": "string",
  "status_disponibilidade": "enum['Disponível', 'Em negociação', 'Acertado com outro clube', 'Indisponível']"
}
```

### 2.2 Posições em Campo

| Sigla | Posição | Sigla | Posição |
|---|---|---|---|
| GOL | Goleiro | VOL | Volante |
| ZAG | Zagueiro Central | MC | Meio-campista Central |
| ZAE | Zagueiro Esquerdo | MEC | Meio-campista Esquerdo |
| ZAD | Zagueiro Direito | MED | Meio-campista Direito |
| LAT | Lateral | MEI | Meio-campista Ofensivo |
| LAE | Lateral Esquerdo | PON | Ponta |
| LAD | Lateral Direito | PEE | Ponta Esquerda |
| SA | Segundo Atacante | PED | Ponta Direita |
| CA | Centroavante | CF | Atacante Central |

### 2.3 Estatísticas Básicas por Temporada

#### 2.3.1 Jogos e Minutos

```json
{
  "temporada": "string (ex: '2025/2026')",
  "clube": "string",
  "liga": "string",
  "jogos_disputados": "number",
  "jogos_titular": "number",
  "jogos_reserva_entrou": "number",
  "jogos_nao_relacionado": "number",
  "minutos_jogados": "number",
  "minutos_por_jogo": "number (calculado)"
}
```

#### 2.3.2 Contribuição Ofensiva

```json
{
  "gols_marcados": "number",
  "assistencias": "number",
  "gols_por_jogo": "number (calculado)",
  "assistencias_por_jogo": "number (calculado)",
  "participacao_gols": "number (gols+assistências)",
  "media_participacao": "number",
  "finalizacoes": "number",
  "finalizacoes_no_alvo": "number",
  "precisao_finalizacao": "percentage",
  "chutes_bloqueados": "number",
  "chutes_fora": "number",
  "gols_esperados_xG": "number",
  "assistencias_esperadas_xA": "number",
  "gols_efetivos_menos_xG": "number (calculado)"
}
```

#### 2.3.3 Passes e Construção de Jogo

```json
{
  "passes_tentados": "number",
  "passes_completos": "number",
  "precisao_passes": "percentage",
  "passes_chave": "number",
  "passes_para_finalizacao": "number",
  "passes_longos_tentados": "number",
  "passes_longos_completos": "number",
  "precisao_passes_longos": "percentage",
  "cruzamentos_tentados": "number",
  "cruzamentos_completos": "number",
  "precisao_cruzamentos": "percentage"
}
```

#### 2.3.4 Dribles e Duelos

```json
{
  "dribles_tentados": "number",
  "dribles_completos": "number",
  "sucesso_dribles": "percentage",
  "desarmes": "number",
  "desarmes_por_jogo": "number",
  "interceptacoes": "number",
  "interceptacoes_por_jogo": "number",
  "cortes": "number",
  "cortes_por_jogo": "number",
  "bloqueios": "number",
  "bolas_recuperadas": "number",
  "duelos_aereos_ganhos": "number",
  "duelos_aereos_perdidos": "number",
  "porcentagem_duelos_aereos": "percentage",
  "duelos_terra_ganhos": "number",
  "duelos_terra_perdidos": "number",
  "porcentagem_duelos_terra": "percentage"
}
```

#### 2.3.5 Disciplina e Finalização

```json
{
  "faltas_cometidas": "number",
  "faltas_sofridas": "number",
  "cartoes_amarelos": "number",
  "cartoes_vermelhos": "number",
  "penalties_convertidos": "number",
  "penalties_perdidos": "number",
  "gols_de_cabeca": "number",
  "gols_pe_esquerdo": "number",
  "gols_pe_direito": "number",
  "gols_fora_area": "number",
  "gols_dentro_area": "number",
  "finalizacoes_com_cabeca": "number",
  "precisao_cabeca": "percentage"
}
```

### 2.4 Métricas por Posição (Específicas)

#### 2.4.1 Goleiros

```json
{
  "defesas": "number",
  "defesas_por_jogo": "number",
  "gols_sofridos": "number",
  "media_gols_sofridos": "number",
  "clean_sheets": "number",
  "porcentagem_clean_sheets": "percentage",
  "defesas_em_penalty": "number",
  "penalties_defendidos": "number",
  "gols_esperados_sofridos_xG": "number",
  "gols_efetivos_menos_xG": "number",
  "saidas_goleiro": "number",
  "saidas_bem_sucedidas": "number",
  "precisao_saidas": "percentage",
  "defesas_baixas": "number",
  "defesas_medias": "number",
  "defesas_altas": "number",
  "distribuicao_com_pes": "number",
  "precisao_distribuicao_pes": "percentage",
  "distribuicao_com_maos": "number",
  "precisao_distribuicao_maos": "percentage"
}
```

#### 2.4.2 Defensores (Zagueiros e Laterais)

```json
{
  "desarmes_corretos": "number",
  "desarmes_incorretos": "number",
  "interceptacoes_por_jogo": "number",
  "coberturas_defensivas": "number",
  "linhas_de_passe_quebradas": "number",
  "duelos_defensivos_ganhos": "number",
  "duelos_defensivos_perdidos": "number",
  "precisao_defensiva": "percentage",
  "passes_de_saida": "number",
  "passes_de_saida_completos": "number",
  "precisao_saida": "percentage",
  "construcao_de_jogo": "number",
  "bolas_progressivas": "number",
  "cruzamentos_defendidos": "number"
}
```

#### 2.4.3 Meio-Campistas

```json
{
  "passes_de_ruptura": "number",
  "passes_para_area": "number",
  "passes_progressivos": "number",
  "bolas_criadas": "number",
  "chances_criadas": "number",
  "chances_criadas_por_jogo": "number",
  "chaves_de_passe": "number",
  "passe_decisivo_por_jogo": "number",
  "conducao_progressiva": "number",
  "distancia_percorrida_km": "number",
  "sprint_velocidade_maxima_kmh": "number",
  "cobertura_defensiva": "number",
  "recuperacoes_posse": "number",
  "pressao_alta": "number",
  "posse_bola_media": "percentage",
  "toques_na_bola": "number"
}
```

#### 2.4.4 Atacantes

```json
{
  "finalizacoes_por_jogo": "number",
  "chutes_por_gol": "number",
  "gols_esperados_por_finalizacao": "number",
  "big_chances_convertidas": "number",
  "big_chances_perdidas": "number",
  "eficiencia_finalizacao": "percentage",
  "finalizacoes_com_pe_esquerdo": "number",
  "finalizacoes_com_pe_direito": "number",
  "finalizacoes_cabeca": "number",
  "gols_fora_area": "number",
  "gols_contra_ataque": "number",
  "gols_de_bola_parada": "number",
  "dribles_por_jogo": "number",
  "dribles_sucesso": "percentage",
  "cruzamentos_por_jogo": "number",
  "precisao_cruzamentos": "percentage",
  "passes_decisivos_por_jogo": "number"
}
```

### 2.5 Métricas de Intensidade e Físico

```json
{
  "distancia_percorrida_por_jogo_km": "number",
  "sprints_por_jogo": "number",
  "aceleracoes": "number",
  "deceleracoes": "number",
  "velocidade_maxima_kmh": "number",
  "velocidade_media_kmh": "number",
  "potencia_fisica": "number (0-100)",
  "capacidade_aerobica": "number (0-100)",
  "resistencia": "number (0-100)",
  "explosao": "number (0-100)",
  "agilidade": "number (0-100)",
  "forca": "number (0-100)",
  "carga_fisica_total": "number",
  "fadiga_acumulada": "number (0-100)",
  "recuperacao_media": "number (dias)",
  "lesoes_musculares_historico": "array[object]"
}
```

### 2.6 Registro de Lesões

```json
{
  "lesoes": [
    {
      "lesao_id": "UUID",
      "data_inicio": "date",
      "data_previsao_retorno": "date",
      "data_retorno_efetivo": "date",
      "dias_afastado": "number",
      "jogos_perdidos": "number",
      "tipo_lesao": "enum['Muscular', 'Ligamento', 'Osso', 'Tendão', 'Cartilagem', 'Concussão', 'Cirurgia', 'Outro']",
      "localizacao": "enum['Coxa', 'Panturrilha', 'Joelho', 'Tornozelo', 'Pé', 'Quadril', 'Virilha', 'Costas', 'Ombro', 'Mão/Braço', 'Cabeça']",
      "lado": "enum['Esquerdo', 'Direito', 'Ambos']",
      "gravidade": "enum['Pequena (<7 dias)', 'Moderada (7-28 dias)', 'Severa (28-84 dias)', 'Muito Severa (>84 dias)']",
      "causa": "enum['Contato', 'Muscular sem contato', 'Sobrecarga', 'Recidiva', 'Acidente de treino']",
      "recidiva": "boolean",
      "cirurgia_necessaria": "boolean",
      "cirurgia_realizada": "boolean",
      "medicacao": "string",
      "departamento_medico": "string",
      "tratamento": "string",
      "observacoes": "text"
    }
  ],
  "metricas_lesoes": {
    "total_lesoes": "number",
    "media_dias_afastado": "number",
    "media_jogos_perdidos": "number",
    "lesoes_por_temporada": "array[object]",
    "taxa_recidiva": "percentage",
    "lesoes_musculares_percentual": "percentage",
    "disponibilidade_media": "percentage (jogos disponíveis / jogos totais)",
    "historico_fragilidade": "enum['Baixo risco', 'Médio risco', 'Alto risco', 'Muito alto risco']"
  }
}
```

---

## 3. Análise de Temporadas - Evolução e Projeção

### 3.1 Comparação Entre Temporadas

```json
{
  "ultimas_temporadas": [
    {
      "temporada": "2025/2026",
      "jogos": "number",
      "gols": "number",
      "assistencias": "number",
      "media_avaliacao": "number (0-10)",
      "xG": "number",
      "xA": "number",
      "desarmes": "number",
      "precisao_passes": "percentage",
      "duelos_ganhos": "percentage",
      "nota_global": "number (0-100)"
    }
  ],
  "analise_evolucao": {
    "tendencia_desempenho": "enum['Crescendo', 'Estável', 'Decaindo', 'Irregular']",
    "melhora_percentual": "percentage",
    "piora_percentual": "percentage",
    "media_ultima_temporada": "number",
    "media_ultimas_3_temporadas": "number",
    "diferenca_media": "number",
    "projecao_proxima_temporada": "number (0-100)",
    "confiabilidade_projecao": "percentage"
  }
}
```

---

## 4. Avaliação Qualitativa (Scout Manual)

### 4.1 Aspectos Táticos, Técnicos e Comportamentais

```json
{
  "avaliacao_tecnica": {
    "passe_curto": "number (0-100)",
    "passe_longo": "number (0-100)",
    "passe_decisivo": "number (0-100)",
    "cruzamento": "number (0-100)",
    "finalizacao": "number (0-100)",
    "drible": "number (0-100)",
    "controle_bola": "number (0-100)",
    "recepcao": "number (0-100)",
    "visao_jogo": "number (0-100)",
    "inteligencia_tatica": "number (0-100)"
  },
  "avaliacao_fisica": {
    "velocidade": "number (0-100)",
    "forca_fisica": "number (0-100)",
    "resistencia": "number (0-100)",
    "agilidade": "number (0-100)",
    "impulsao": "number (0-100)",
    "equilibrio": "number (0-100)",
    "coordenacao": "number (0-100)"
  },
  "avaliacao_comportamental": {
    "lideranca": "number (0-100)",
    "personalidade": "number (0-100)",
    "comprometimento": "number (0-100)",
    "adaptabilidade": "number (0-100)",
    "profissionalismo": "number (0-100)",
    "resiliencia": "number (0-100)",
    "disciplina_tatica": "number (0-100)",
    "relacionamento_grupo": "number (0-100)"
  },
  "observacoes_gerais": "text",
  "perfil_psicologico": "text",
  "potencial_de_mercado": "enum['Alto', 'Médio', 'Baixo']",
  "potencial_de_desenvolvimento": "number (0-100)",
  "recomendacao_final": "enum['Comprar imediatamente', 'Monitorar', 'Descartar']",
  "scout_responsavel": "string",
  "data_avaliacao": "date"
}
```

---

## 5. Adaptação e Contexto de Ligas

### 5.1 Ajuste por Nível da Liga (Fator de Correção)

```json
{
  "liga": "string",
  "nivel_competitivo": "number (0-100)",
  "fator_correcao": "number (multiplicador)",
  "liga_top_5": "boolean",
  "liga_emergente": "boolean",
  "dificuldade_adaptacao_estimada": "enum['Baixa', 'Média', 'Alta']",
  "similaridade_estilo_jogo": "percentage",
  "clima_diferenca": "text",
  "idioma_barreira": "enum['Nenhuma', 'Baixa', 'Média', 'Alta']",
  "historico_adaptacao": "array[object]"
}
```

### 5.2 Comparativo Entre Ligas

```json
{
  "liga_origem": "string",
  "liga_destino": "string",
  "fator_conversao": "number",
  "statisticas_ajustadas": {
    "gols_ajustados": "number",
    "assistencias_ajustadas": "number",
    "desarmes_ajustados": "number",
    "precisao_ajustada": "percentage"
  },
  "desempenho_esperado_na_liga_destino": "number (0-100)"
}
```

---

## 6. Análise de Mercado e Custo-Benefício

### 6.1 Avaliação Econômica

```json
{
  "valor_mercado_atual": "number (€)",
  "variacao_valor_1ano": "percentage",
  "variacao_valor_3anos": "percentage",
  "valor_estimado_negociacao": "number (€)",
  "salario_atual": "number (€)",
  "salario_pretendido": "number (€)",
  "custo_total_operacao": "number (€)",
  "custo_por_gol": "number (€)",
  "custo_por_jogo": "number (€)",
  "retorno_estimado": "number (€)",
  "lucro_potencial": "number (€)",
  "relacao_custo_beneficio": "number (0-100)",
  "risco_financeiro": "enum['Baixo', 'Médio', 'Alto']",
  "tipo_negociacao": "enum['Compra definitiva', 'Empréstimo', 'Trocas', 'Pré-contrato']",
  "janela_negociacao": "enum['Janeiro', 'Julho', 'Ambas']",
  "disponibilidade_clube_vender": "enum['Sim', 'Não', 'Sob negociação']"
}
```

---

## 7. Filtros e Sistema de Busca Avançada

### 7.1 Filtros Disponíveis no Dashboard

| Categoria | Filtros |
|---|---|
| Jogador | Nome, Idade (range), Nacionalidade, Posição, Pé dominante, Altura (range), Peso (range) |
| Clube | Clube atual, Liga, País, Data fim contrato (range) |
| Desempenho | Min. jogos, Gols (range), Assistências (range), xG (range), xA (range), Precisão passes (range), Desarmes (range), Nota média (range) |
| Lesões | Dias afastados (máx.), Tipo lesão, Gravidade, Recidiva, Disponibilidade mínima |
| Mercado | Valor mercado (range), Custo total (range), Status contrato, Tipo negociação |
| Scout | Data avaliação, Scout responsável, Recomendação final, Potencial (range) |

---

## 8. Relatório do Jogador - Visão Única

### 8.1 Estrutura do Relatório Final

```json
{
  "cabecalho": {
    "nome_jogador": "string",
    "foto": "string (URL)",
    "idade": "number",
    "posicao": "string",
    "clube": "string",
    "liga": "string",
    "nacionalidade": "string",
    "data_relatorio": "date"
  },
  "resumo_executivo": {
    "nota_global": "number (0-100)",
    "potencial": "number (0-100)",
    "custo_beneficio": "number (0-100)",
    "risco_lesoes": "enum",
    "recomendacao": "enum"
  },
  "graficos_e_metricas": {
    "grafico_radar": "object (8 dimensões)",
    "evolucao_temporadas": "array",
    "comparacao_liga": "object"
  },
  "analise_detalhada": {
    "tecnica": "array[object]",
    "tatica": "array[object]",
    "fisica": "array[object]",
    "comportamental": "array[object]"
  },
  "historico_lesoes": "array[object]",
  "analise_mercado": "object",
  "observacoes_scout": "text",
  "sugestao_estrategica": "text"
}
```

---

## 9. Sistema de Compatibilidade (Fit)

### 9.1 Entrada do Usuário

```json
{
  "estilo_jogo_clube": "enum['Posse de bola', 'Contra-ataque', 'Pressão alta', 'Transição rápida', 'Jogo direto', 'Defesa sólida']",
  "sistema_tatico": "string (ex: '4-3-3', '4-4-2', '3-5-2')",
  "prioridades": {
    "tecnica": "number (0-100)",
    "fisica": "number (0-100)",
    "tatica": "number (0-100)",
    "comportamento": "number (0-100)"
  },
  "orcamento": "number (€)",
  "necessidade_imediata": "enum['Titular', 'Reserva', 'Projeto futuro']"
}
```

### 9.2 Saída do Sistema

```json
{
  "jogador": "string",
  "fit_global": "number (0-100)",
  "fit_tecnico": "number (0-100)",
  "fit_tatico": "number (0-100)",
  "fit_fisico": "number (0-100)",
  "fit_mercado": "number (0-100)",
  "compatibilidade_sistema": "number (0-100)",
  "justificativa": "text"
}
```

---

## 10. Alertas Inteligentes

### 10.1 Estrutura de Alertas

```json
{
  "alertas": [
    {
      "tipo": "enum['Contrato próximo do fim', 'Alta valorização', 'Baixa valorização', 'Lesão recorrente', 'Desempenho em alta', 'Desempenho em queda', 'Descoberta de jovem talento', 'Oportunidade de mercado']",
      "jogador_id": "UUID",
      "mensagem": "text",
      "prioridade": "enum['Baixa', 'Média', 'Alta', 'Urgente']",
      "data_geracao": "datetime",
      "acao_sugerida": "text"
    }
  ]
}
```

---

## 11. APIs e Fontes de Dados

### 11.1 Integrações Recomendadas

| Tipo | APIs Sugeridas |
|---|---|
| Estatísticas | Opta (Stats Perform), Wyscout API, FootyStats API, Transfermarkt API, ESPN API, Football-Data.org, Sportmonks API |
| Lesões | InjuryHero API, Premier League Injuries, Transfermarkt Injury History |
| Mercado | Transfermarkt (scraping), CIES Football Observatory |
| Web Scraping | SofaScore, WhoScored, FBRef, ZeroZero.pt |

---

## 12. Tecnologias Sugeridas

| Camada | Tecnologias |
|---|---|
| Frontend | React.js / Next.js com TypeScript |
| Backend | Node.js (Express) ou Python (Django/FastAPI) |
| Database | PostgreSQL (dados estruturados) + MongoDB (documentos, relatórios) |
| Cache | Redis (para consultas frequentes) |
| Analytics | Chart.js / D3.js para gráficos |
| Relatórios | PDFKit / Puppeteer para PDF |
| Autenticação | JWT + OAuth2 |
| Versionamento | Git + GitHub/GitLab |