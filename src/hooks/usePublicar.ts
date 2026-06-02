import { useState, useCallback } from 'react';
import { criarDesabafo } from '../firebase/desabafos';
import { validarTextoDesabafo } from '../utils/validacao';
import type { Sentimento, Desabafo } from '../types';

interface UsePublicarReturn {
  publicar: (texto: string, sentimento: Sentimento) => Promise<Desabafo | null>;
  isPublicando: boolean;
  error: string | null;
}

/**
 * Hook para publicar desabafos (requer uid de usuário autenticado).
 *
 * - Valida texto antes de enviar (não vazio, não whitespace, ≤2000 chars)
 * - Chama criarDesabafo do serviço Firebase com uid
 * - Retorna o desabafo criado para inserção no topo do feed
 * - Gerencia estado isPublicando e error
 *
 * Validates: Requirements 1.3, 1.4, 1.7, 1.8, 1.9, 1.11
 */
export function usePublicar(uid: string): UsePublicarReturn {
  const [isPublicando, setIsPublicando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const publicar = useCallback(
    async (texto: string, sentimento: Sentimento): Promise<Desabafo | null> => {
      // Limpar erro anterior no início de cada tentativa
      setError(null);

      // Validar texto antes de enviar
      const validacao = validarTextoDesabafo(texto);
      if (!validacao.valido) {
        setError(validacao.erro ?? 'Texto inválido.');
        return null;
      }

      setIsPublicando(true);

      try {
        const id = await criarDesabafo(texto, sentimento, uid);

        // Construir o desabafo criado para inserção no topo do feed
        const novoDesabafo: Desabafo = {
          id,
          texto,
          sentimento,
          criadoEm: new Date(),
          reacoes: { apoio: 0, forca: 0, pouco: 0 },
          totalComentarios: 0,
        };

        return novoDesabafo;
      } catch {
        setError('Erro ao publicar. Tente novamente.');
        return null;
      } finally {
        setIsPublicando(false);
      }
    },
    [uid]
  );

  return { publicar, isPublicando, error };
}
