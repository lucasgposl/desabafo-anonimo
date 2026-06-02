/**
 * Configuração centralizada de sentimentos e reações.
 * Este arquivo serve como single source of truth para os valores disponíveis.
 *
 * Tipos TypeScript são derivados automaticamente via `keyof typeof`,
 * eliminando duplicação e garantindo que adicionar/remover opções
 * exige alteração apenas neste arquivo.
 */

interface SentimentoEntry {
  label: string;
  emoji: string;
  categoria: 'dramas' | 'good_vibes';
}

interface ReacaoEntry {
  label: string;
  emoji: string;
}

export const SENTIMENTO_CONFIG = {
  meus_olhos_tao_tremendo: { label: 'Meus olhos tão tremendo', emoji: '😤', categoria: 'dramas' },
  surto_controlado: { label: 'Surto controlado', emoji: '🤯', categoria: 'dramas' },
  joguei_no_ventilador: { label: 'Joguei no ventilador', emoji: '💩', categoria: 'dramas' },
  indiretinha: { label: 'Indiretinha', emoji: '🙄', categoria: 'dramas' },
  desaforo: { label: 'Desaforo', emoji: '😠', categoria: 'dramas' },
  mimimi_legitimo: { label: 'Mimimi legítimo', emoji: '🥲', categoria: 'dramas' },
  to_de_saco_cheio: { label: 'Tô de saco cheio', emoji: '😩', categoria: 'dramas' },
  choro_facil: { label: 'Choro fácil', emoji: '😭', categoria: 'dramas' },
  foi_pra_conta: { label: 'Foi pra conta', emoji: '🌋', categoria: 'dramas' },
  good_vibes: { label: 'Good vibes', emoji: '✨', categoria: 'good_vibes' },
  apaixonado: { label: 'Apaixonado', emoji: '🥰', categoria: 'good_vibes' },
  crush: { label: 'Crush', emoji: '🫦', categoria: 'good_vibes' },
  cupido_acertou: { label: 'Cupido acertou', emoji: '💘', categoria: 'good_vibes' },
  final_feliz: { label: 'Final feliz', emoji: '🎉', categoria: 'good_vibes' },
  relaxado: { label: 'Relaxado', emoji: '😎', categoria: 'good_vibes' },
} as const satisfies Record<string, SentimentoEntry>;

export const REACAO_CONFIG = {
  quem_nunca: { label: 'Quem nunca', emoji: '🙋' },
  nao_julgo: { label: 'Não julgo', emoji: '🤷' },
  se_ja_fiz_nao_me_lembro: { label: 'Se já fiz não me lembro', emoji: '🫣' },
  tomara_que_passe: { label: 'Tomara que passe', emoji: '🤞' },
  eu_ia_pior: { label: 'Eu ia pior', emoji: '📈' },
  respira_fundo: { label: 'Respira fundo', emoji: '🧘' },
  chama_no_particular: { label: 'Chama no particular', emoji: '📩' },
  to_rindo_mas_e_de_nervoso: { label: 'Tô rindo mas é de nervoso', emoji: '😅' },
} as const satisfies Record<string, ReacaoEntry>;

// Tipos derivados automaticamente
export type Sentimento = keyof typeof SENTIMENTO_CONFIG;
export type TipoReacao = keyof typeof REACAO_CONFIG;

// Helpers derivados
export type CategoriaSentimento = 'dramas' | 'good_vibes';

export const CATEGORIAS: Record<CategoriaSentimento, string> = {
  dramas: 'Dramas',
  good_vibes: 'Good Vibes',
};

// Helper: agrupar sentimentos por categoria (preserva ordem do config)
export function sentimentosPorCategoria(): Record<CategoriaSentimento, Sentimento[]> {
  const resultado: Record<CategoriaSentimento, Sentimento[]> = { dramas: [], good_vibes: [] };
  for (const [chave, entry] of Object.entries(SENTIMENTO_CONFIG)) {
    resultado[entry.categoria].push(chave as Sentimento);
  }
  return resultado;
}

// Helper: inicializar objeto de reações com zeros
export function criarReacoesIniciais(): Record<TipoReacao, number> {
  const reacoes = {} as Record<TipoReacao, number>;
  for (const chave of Object.keys(REACAO_CONFIG)) {
    reacoes[chave as TipoReacao] = 0;
  }
  return reacoes;
}

// Helper: validar se string é sentimento válido
export function isSentimentoValido(valor: string): valor is Sentimento {
  return valor in SENTIMENTO_CONFIG;
}

// Helper: obter info de sentimento com fallback para legados
export function obterInfoSentimento(valor: string): { label: string; emoji: string; categoria: CategoriaSentimento | null } {
  if (isSentimentoValido(valor)) {
    const entry = SENTIMENTO_CONFIG[valor];
    return { label: entry.label, emoji: entry.emoji, categoria: entry.categoria };
  }
  return { label: 'Sentimento antigo', emoji: '❓', categoria: null };
}

// Helper: normalizar reações de documento (preencher ausentes com 0, ignorar obsoletas)
export function normalizarReacoes(docReacoes: Record<string, number> | undefined): Record<TipoReacao, number> {
  const resultado = criarReacoesIniciais();
  if (docReacoes) {
    for (const chave of Object.keys(REACAO_CONFIG)) {
      if (chave in docReacoes) {
        resultado[chave as TipoReacao] = docReacoes[chave] ?? 0;
      }
    }
  }
  return resultado;
}
