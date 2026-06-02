import { useState, useEffect, useCallback } from 'react';
import { loginComGoogle, logout as firebaseLogout, onAuthChange } from '../firebase/auth';
import { UsuarioAuth } from '../types';

interface UseAuthReturn {
  usuario: UsuarioAuth | null;
  isLoading: boolean;
  isAutenticado: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Hook de autenticação com Firebase Auth.
 *
 * - Observa mudanças no estado de autenticação via onAuthChange (onAuthStateChanged)
 * - Restaura sessão automaticamente ao carregar a página
 * - login() inicia fluxo Google popup; cancelamento NÃO gera erro
 * - logout() encerra sessão
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */
export function useAuth(): UseAuthReturn {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Observar estado de autenticação (restaura sessão ao carregar página)
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setUsuario({ uid: user.uid });
      } else {
        setUsuario(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginComGoogle();
      // O estado será atualizado pelo listener onAuthChange
    } catch (err: unknown) {
      // Cancelamento do popup (user fechou ou negou permissão) — não exibir erro
      if (
        err instanceof Error &&
        (err as { code?: string }).code === 'auth/popup-closed-by-user'
      ) {
        // Retorna ao estado de visitante sem mensagem de erro
        setIsLoading(false);
        return;
      }
      // Erro real de autenticação
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await firebaseLogout();
      // O estado será atualizado pelo listener onAuthChange
    } catch {
      setError('Erro ao fazer logout. Tente novamente.');
    }
  }, []);

  const isAutenticado = usuario !== null;

  return {
    usuario,
    isLoading,
    isAutenticado,
    error,
    login,
    logout,
  };
}
