import { useState, useEffect, useRef } from 'react';
import { verificarAdmin } from '../firebase/admin';

/**
 * Hook para verificar se o usuário é administrador.
 * Consulta a coleção "admins" no Firestore.
 *
 * @param uid - O uid do usuário autenticado, ou null se não autenticado
 * @returns { isAdmin, isLoading }
 */
export function useAdmin(uid: string | null): { isAdmin: boolean; isLoading: boolean } {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const previousUid = useRef<string | null>(null);

  useEffect(() => {
    // Quando uid é null, retornar imediatamente sem consultar
    if (!uid) {
      setIsAdmin(false);
      setIsLoading(false);
      previousUid.current = null;
      return;
    }

    // Se o uid mudou, marcar como loading imediatamente
    if (previousUid.current !== uid) {
      setIsLoading(true);
      setIsAdmin(false);
      previousUid.current = uid;
    }

    let cancelado = false;

    verificarAdmin(uid)
      .then((resultado) => {
        if (!cancelado) {
          setIsAdmin(resultado);
        }
      })
      .catch(() => {
        // Em caso de erro, default para não-admin
        if (!cancelado) {
          setIsAdmin(false);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [uid]);

  return { isAdmin, isLoading };
}
