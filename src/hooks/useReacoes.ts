import { useState, useCallback } from 'react';
import { incrementarReacao } from '../firebase/desabafos';
import type { Desabafo, TipoReacao } from '../types';

interface UseReacoesReturn {
  reagir: (desabafoId: string, tipo: TipoReacao) => Promise<void>;
  isReagindo: Record<string, boolean>;
  reacaoUsuario: Record<string, TipoReacao | null>;
}

/**
 * Hook para reações aos desabafos com optimistic update.
 *
 * - Não requer autenticação (visitantes podem reagir)
 * - Incrementa o contador localmente antes da confirmação do Firestore
 * - Reverte o incremento em caso de falha (rollback)
 * - Limita a UMA reação por desabafo por sessão (pode trocar de tipo)
 *
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6
 */
export function useReacoes(
  _desabafos: Desabafo[],
  setDesabafos: React.Dispatch<React.SetStateAction<Desabafo[]>>
): UseReacoesReturn {
  const [isReagindo, setIsReagindo] = useState<Record<string, boolean>>({});
  // Rastreia qual reação o usuário já deu em cada desabafo nesta sessão
  const [reacaoUsuario, setReacaoUsuario] = useState<Record<string, TipoReacao | null>>({});

  const reagir = useCallback(
    async (desabafoId: string, tipo: TipoReacao): Promise<void> => {
      const reacaoAtual = reacaoUsuario[desabafoId] ?? null;

      // Se já reagiu com o mesmo tipo, ignorar (já reagiu)
      if (reacaoAtual === tipo) {
        return;
      }

      // Marcar como reagindo
      setIsReagindo((prev) => ({ ...prev, [desabafoId]: true }));

      // 1. Optimistic update: incrementar o novo tipo
      setDesabafos((prev) =>
        prev.map((d) => {
          if (d.id !== desabafoId) return d;
          const novasReacoes = { ...d.reacoes, [tipo]: d.reacoes[tipo] + 1 };
          // Se tinha uma reação anterior diferente, decrementar
          if (reacaoAtual) {
            novasReacoes[reacaoAtual] = d.reacoes[reacaoAtual] - 1;
          }
          return { ...d, reacoes: novasReacoes };
        })
      );

      // Registrar a nova reação do usuário
      setReacaoUsuario((prev) => ({ ...prev, [desabafoId]: tipo }));

      try {
        // 2. Persistir no Firestore (incrementar novo tipo)
        await incrementarReacao(desabafoId, tipo);
        // Nota: decrementar o tipo anterior não é suportado pelo Firestore rules atuais
        // Para simplificar, apenas incrementamos o novo. O decremento visual é local.
      } catch {
        // 3. Rollback: reverter incremento em caso de falha
        setDesabafos((prev) =>
          prev.map((d) => {
            if (d.id !== desabafoId) return d;
            const novasReacoes = { ...d.reacoes, [tipo]: d.reacoes[tipo] - 1 };
            if (reacaoAtual) {
              novasReacoes[reacaoAtual] = d.reacoes[reacaoAtual] + 1;
            }
            return { ...d, reacoes: novasReacoes };
          })
        );
        // Reverter a reação do usuário
        setReacaoUsuario((prev) => ({ ...prev, [desabafoId]: reacaoAtual }));
      } finally {
        setIsReagindo((prev) => ({ ...prev, [desabafoId]: false }));
      }
    },
    [setDesabafos, reacaoUsuario]
  );

  return { reagir, isReagindo, reacaoUsuario };
}
