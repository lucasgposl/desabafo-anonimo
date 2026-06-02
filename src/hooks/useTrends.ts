import { useState, useEffect, useCallback } from 'react';
import { buscarDesabafosTrends, operacaoSegura } from '../firebase/desabafos';
import { ordenarPorPopularidade, paginar } from '../utils/trends';
import type { Desabafo } from '../types';

const ITENS_POR_PAGINA = 10;

interface UseTrendsReturn {
  desabafos: Desabafo[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  total: number;
}

/**
 * Hook para gerenciar a página Trends.
 *
 * - Busca todos os desabafos dos últimos 30 dias via buscarDesabafosTrends()
 * - Ordena por total de interações (desc) com tiebreaker por criadoEm (desc)
 * - Gerencia paginação client-side (10 itens por página)
 * - Trata erros e timeout (10s) com operacaoSegura
 *
 * Validates: Requirements 1.2, 3.1, 3.4, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2
 */
export function useTrends(): UseTrendsReturn {
  const [todosDesabafos, setTodosDesabafos] = useState<Desabafo[]>([]);
  const [desabafos, setDesabafos] = useState<Desabafo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState<number>(1);

  const total = todosDesabafos.length;
  const hasMore = desabafos.length < total;

  /**
   * Busca desabafos dos últimos 30 dias, ordena por popularidade
   * e exibe a primeira página.
   */
  const fetchTrends = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const resultado = await operacaoSegura(
      () => buscarDesabafosTrends(),
      () => {
        // Error handling is done below after checking resultado
      },
      10000
    );

    if (resultado === null) {
      setError('Não foi possível carregar os desabafos em alta.');
      setIsLoading(false);
      return;
    }

    const ordenados = ordenarPorPopularidade(resultado);
    setTodosDesabafos(ordenados);

    const primeiraPagina = paginar(ordenados, 1, ITENS_POR_PAGINA);
    setDesabafos(primeiraPagina);
    setPagina(1);
    setIsLoading(false);
  }, []);

  // Buscar dados na montagem
  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  /**
   * Carrega mais desabafos (próxima página) do array já ordenado.
   * Concatena os novos itens aos já exibidos.
   */
  const loadMore = useCallback(() => {
    const proximaPagina = pagina + 1;
    const novosItens = paginar(todosDesabafos, proximaPagina, ITENS_POR_PAGINA);
    setDesabafos((prev) => [...prev, ...novosItens]);
    setPagina(proximaPagina);
  }, [pagina, todosDesabafos]);

  return {
    desabafos,
    isLoading,
    error,
    hasMore,
    loadMore,
    total,
  };
}
