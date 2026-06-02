import { Desabafo } from '../types';

/**
 * Calcula o total de interações de um desabafo.
 * Total = reacoes.apoio + reacoes.forca + reacoes.pouco + totalComentarios
 * Trata campos ausentes como 0.
 */
export function calcularTotalInteracoes(desabafo: Desabafo): number {
  const apoio = desabafo.reacoes?.apoio ?? 0;
  const forca = desabafo.reacoes?.forca ?? 0;
  const pouco = desabafo.reacoes?.pouco ?? 0;
  const comentarios = desabafo.totalComentarios ?? 0;

  return apoio + forca + pouco + comentarios;
}

/**
 * Ordena desabafos por total de interações (decrescente).
 * Tiebreaker: criadoEm mais recente primeiro.
 * Retorna novo array (não muta o original).
 */
export function ordenarPorPopularidade(desabafos: Desabafo[]): Desabafo[] {
  return [...desabafos].sort((a, b) => {
    const scoreA = calcularTotalInteracoes(a);
    const scoreB = calcularTotalInteracoes(b);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Tiebreaker: mais recente primeiro
    return b.criadoEm.getTime() - a.criadoEm.getTime();
  });
}

/**
 * Retorna uma fatia do array para a página solicitada.
 * @param items - Array de itens a paginar
 * @param pagina - Número da página (1-indexed)
 * @param tamanhoPagina - Itens por página (default: 10)
 */
export function paginar<T>(items: T[], pagina: number, tamanhoPagina: number = 10): T[] {
  const inicio = (pagina - 1) * tamanhoPagina;
  return items.slice(inicio, inicio + tamanhoPagina);
}
