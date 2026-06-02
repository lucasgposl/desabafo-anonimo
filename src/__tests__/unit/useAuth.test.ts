/**
 * Testes unitários para o hook useAuth (src/hooks/useAuth.ts)
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import { renderHook, act } from '@testing-library/react';

// Mocks
const mockLoginComGoogle = jest.fn();
const mockLogout = jest.fn();
const mockOnAuthChange = jest.fn();

jest.mock('../../firebase/auth', () => ({
  loginComGoogle: (...args: unknown[]) => mockLoginComGoogle(...args),
  logout: (...args: unknown[]) => mockLogout(...args),
  onAuthChange: (callback: (user: { uid: string } | null) => void) =>
    mockOnAuthChange(callback),
}));

import { useAuth } from '../../hooks/useAuth';

describe('useAuth', () => {
  let authCallback: ((user: { uid: string } | null) => void) | null = null;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    authCallback = null;

    mockOnAuthChange.mockImplementation(
      (callback: (user: { uid: string } | null) => void) => {
        authCallback = callback;
        return mockUnsubscribe;
      }
    );
  });

  describe('Estado inicial', () => {
    it('deve iniciar com isLoading true e usuario null', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.usuario).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAutenticado).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve registrar listener de auth ao montar', () => {
      renderHook(() => useAuth());

      expect(mockOnAuthChange).toHaveBeenCalledTimes(1);
      expect(mockOnAuthChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('deve chamar unsubscribe ao desmontar', () => {
      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('Restauração de sessão (Req 10.5)', () => {
    it('deve restaurar sessão quando onAuthChange emite usuário', async () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!({ uid: 'user-123' });
      });

      expect(result.current.usuario).toEqual({ uid: 'user-123' });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAutenticado).toBe(true);
    });

    it('deve definir usuario como null quando onAuthChange emite null', async () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!({ uid: 'user-123' });
      });

      act(() => {
        authCallback!(null);
      });

      expect(result.current.usuario).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAutenticado).toBe(false);
    });
  });

  describe('login (Req 10.2, 10.3)', () => {
    it('deve chamar loginComGoogle ao executar login', async () => {
      mockLoginComGoogle.mockResolvedValue({ user: { uid: 'new-user' } });
      const { result } = renderHook(() => useAuth());

      // Simular estado inicial carregado
      act(() => {
        authCallback!(null);
      });

      await act(async () => {
        await result.current.login();
      });

      expect(mockLoginComGoogle).toHaveBeenCalledTimes(1);
    });

    it('deve limpar erro anterior ao iniciar login', async () => {
      // Primeiro, causar um erro
      const error = new Error('Auth error');
      (error as { code?: string }).code = 'auth/network-request-failed';
      mockLoginComGoogle.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!(null);
      });

      await act(async () => {
        await result.current.login();
      });

      expect(result.current.error).toBe('Erro ao fazer login. Tente novamente.');

      // Segundo login deve limpar o erro
      mockLoginComGoogle.mockResolvedValueOnce({ user: { uid: 'user-1' } });

      await act(async () => {
        await result.current.login();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cancelamento do login (Req 10.7)', () => {
    it('deve retornar ao estado visitante sem erro quando popup é fechado', async () => {
      const popupError = new Error('Popup closed');
      (popupError as { code?: string }).code = 'auth/popup-closed-by-user';
      mockLoginComGoogle.mockRejectedValue(popupError);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!(null);
      });

      await act(async () => {
        await result.current.login();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.usuario).toBeNull();
      expect(result.current.isAutenticado).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Erro de autenticação (Req 10.6)', () => {
    it('deve definir mensagem de erro quando login falha', async () => {
      const error = new Error('Network error');
      (error as { code?: string }).code = 'auth/network-request-failed';
      mockLoginComGoogle.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!(null);
      });

      await act(async () => {
        await result.current.login();
      });

      expect(result.current.error).toBe('Erro ao fazer login. Tente novamente.');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout (Req 10.4)', () => {
    it('deve chamar firebaseLogout ao executar logout', async () => {
      mockLogout.mockResolvedValue(undefined);
      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!({ uid: 'user-123' });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('deve definir erro quando logout falha', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'));
      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!({ uid: 'user-123' });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.error).toBe('Erro ao fazer logout. Tente novamente.');
    });
  });

  describe('isAutenticado (computado)', () => {
    it('deve ser true quando usuario não é null', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!({ uid: 'user-abc' });
      });

      expect(result.current.isAutenticado).toBe(true);
    });

    it('deve ser false quando usuario é null', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        authCallback!(null);
      });

      expect(result.current.isAutenticado).toBe(false);
    });
  });
});
