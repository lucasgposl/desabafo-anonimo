import { SENTIMENTO_CONFIG, REACAO_CONFIG, Sentimento, TipoReacao } from '../../config/sentimentos';

/**
 * Cria um objeto de reações com todas as chaves da config zeradas.
 * Útil para fixtures de criação de desabafo onde reações iniciam em 0.
 */
export function criarReacoesZeradas(): Record<TipoReacao, number> {
  return Object.fromEntries(Object.keys(REACAO_CONFIG).map(k => [k, 0])) as Record<TipoReacao, number>;
}

/**
 * Cria um objeto de reações com valores zerados e aplica overrides.
 * Útil para fixtures onde algumas reações têm valores específicos.
 */
export function criarReacoesMock(overrides: Record<string, number> = {}): Record<TipoReacao, number> {
  return { ...criarReacoesZeradas(), ...overrides } as Record<TipoReacao, number>;
}

/**
 * Retorna o primeiro sentimento da config como valor padrão.
 * Útil para fixtures que precisam de um sentimento qualquer válido.
 */
export function sentimentoPadrao(): Sentimento {
  return Object.keys(SENTIMENTO_CONFIG)[0] as Sentimento;
}

/**
 * Retorna todos os sentimentos disponíveis na config.
 * Útil para it.each dinâmico nos testes.
 */
export function todosSentimentos(): Sentimento[] {
  return Object.keys(SENTIMENTO_CONFIG) as Sentimento[];
}
