import { useState, useCallback } from 'react';
import { buscarComentarios, criarComentario } from '../firebase/comentarios';
import { validarTextoComentario } from '../utils/validacao';
import type { Comentario } from '../types';

interface UseComentariosReturn {
  comentarios: Comentario[];
  isLoading: boolean;
  totalComentarios: number;
  error: string | null;
  publicarComentario: (texto: string, uid: string) => Promise<boolean>;
  carregarComentarios: () => Promise<void>;
}

/**
 * Hook para gerenciar comentários de um desabafo específico.
 *
 * - Busca comentários da subcoleção (máximo 50, ordenados por data ASC)
 * - publicarComentario(texto, uid) valida e persiste no Firestore
 * - Insere novo comentário na lista local após sucesso
 * - Gerencia estado: comentarios, isLoading, totalComentarios, error
 *
 * Validates: Requirements 11.2, 11.3, 11.4, 11.6, 11.7, 11.8, 11.9
 */
export function useComentarios(desabafoId: string): UseComentariosReturn {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalComentarios, setTotalComentarios] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const carregarComentarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resultado = await buscarComentarios(desabafoId, 50);
      setComentarios(resultado);
      setTotalComentarios(resultado.length);
    } catch {
      setError('Erro ao carregar comentários. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [desabafoId]);

  const publicarComentario = useCallback(
    async (texto: string, uid: string): Promise<boolean> => {
      setError(null);

      // Validar texto do comentário
      const validacao = validarTextoComentario(texto);
      if (!validacao.valido) {
        setError(validacao.erro ?? 'Texto inválido.');
        return false;
      }

      try {
        const novoId = await criarComentario(desabafoId, texto, uid);

        // Inserir novo comentário na lista local
        const novoComentario: Comentario = {
          id: novoId,
          texto,
          criadoEm: new Date(),
          desabafoId,
        };

        setComentarios((prev) => [...prev, novoComentario]);
        setTotalComentarios((prev) => prev + 1);

        return true;
      } catch {
        setError('Erro ao publicar comentário. Tente novamente.');
        return false;
      }
    },
    [desabafoId]
  );

  return {
    comentarios,
    isLoading,
    totalComentarios,
    error,
    publicarComentario,
    carregarComentarios,
  };
}
