import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { buscarDesabafos, operacaoSegura } from '../firebase/desabafos';
import type { Sentimento, Desabafo } from '../types';

const LIMITE_POR_PAGINA = 20;

interface UseDesabafosReturn {
  desabafos: Desabafo[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  total: number;
  inserirNoTopo: (desabafo: Desabafo) => void;
}

/**
 * Hook principal para gerenciar o feed de desabafos.
 *
 * - Busca desabafos do Firestore na montagem e quando filtro muda
 * - Implementa paginação por cursor (startAfter) com limite de 20 por carregamento
 * - Reinicia paginação quando filtro é alterado
 * - Permite inserir novo desabafo no topo da lista local
 * - Trata erros e timeout (10s) com operacaoSegura
 *
 * Validates: Requirements 2.1, 2.5, 3.2, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export function useDesabafos(filtro: Sentimento | 'todos'): UseDesabafosReturn {
  const [desabafos, setDesabafos] = useState<Desabafo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [total, setTotal] = useState<number>(0);

  // Ref para evitar race conditions quando filtro muda rapidamente
  const filtroRef = useRef(filtro);
  filtroRef.current = filtro;

  /**
   * Busca desabafos do Firestore (primeira página ou paginação).
   * Usa operacaoSegura com timeout de 10s.
   */
  const fetchDesabafos = useCallback(
    async (cursor?: DocumentSnapshot | null, append: boolean = false) => {
      setIsLoading(true);
      setError(null);

      const resultado = await operacaoSegura(
        () => buscarDesabafos(filtroRef.current, LIMITE_POR_PAGINA, cursor ?? undefined),
        () => {
          // Error handling is done below after checking resultado
        }
      );

      // Verificar se o filtro mudou durante a busca (race condition)
      if (filtroRef.current !== filtro) return;

      if (resultado === null) {
        setError('Não foi possível carregar os desabafos.');
        setIsLoading(false);
        return;
      }

      const { desabafos: novosDesabafos, ultimoDoc } = resultado;

      if (append) {
        setDesabafos((prev) => [...prev, ...novosDesabafos]);
      } else {
        setDesabafos(novosDesabafos);
      }

      setLastDoc(ultimoDoc);
      setHasMore(novosDesabafos.length === LIMITE_POR_PAGINA);
      setTotal((prev) =>
        append ? prev + novosDesabafos.length : novosDesabafos.length
      );
      setIsLoading(false);
    },
    [filtro]
  );

  // Buscar desabafos na montagem e quando filtro muda
  useEffect(() => {
    // Reiniciar estado ao mudar filtro
    setDesabafos([]);
    setLastDoc(null);
    setHasMore(false);
    setTotal(0);
    setError(null);

    fetchDesabafos(null, false);
  }, [filtro]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Carrega mais desabafos (próxima página) usando cursor.
   */
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && lastDoc) {
      fetchDesabafos(lastDoc, true);
    }
  }, [isLoading, hasMore, lastDoc, fetchDesabafos]);

  /**
   * Reinicia a busca desde o início (retry após erro).
   */
  const refresh = useCallback(() => {
    setDesabafos([]);
    setLastDoc(null);
    setHasMore(false);
    setTotal(0);
    setError(null);
    fetchDesabafos(null, false);
  }, [fetchDesabafos]);

  /**
   * Insere um desabafo recém-publicado no topo da lista local.
   * Incrementa o total em 1.
   */
  const inserirNoTopo = useCallback((desabafo: Desabafo) => {
    setDesabafos((prev) => [desabafo, ...prev]);
    setTotal((prev) => prev + 1);
  }, []);

  return {
    desabafos,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
    inserirNoTopo,
  };
}
