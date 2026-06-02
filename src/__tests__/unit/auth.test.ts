/**
 * Testes unitários para o serviço de autenticação (src/firebase/auth.ts)
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */

// Mock firebase/auth module
const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockGoogleAuthProvider = jest.fn();

jest.mock('firebase/auth', () => ({
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  GoogleAuthProvider: class {
    constructor() {
      mockGoogleAuthProvider();
    }
  },
  getAuth: jest.fn(() => ({ currentUser: null })),
}));

jest.mock('../../firebase/config', () => ({
  auth: { currentUser: null },
  db: {},
}));

import { loginComGoogle, logout, onAuthChange, googleProvider } from '../../firebase/auth';

describe('Serviço de Autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginComGoogle', () => {
    it('deve chamar signInWithPopup com auth e GoogleAuthProvider', async () => {
      const mockCredential = { user: { uid: 'test-uid' } };
      mockSignInWithPopup.mockResolvedValue(mockCredential);

      const result = await loginComGoogle();

      expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
      expect(mockSignInWithPopup).toHaveBeenCalledWith(
        expect.anything(), // auth instance
        expect.any(Object)  // googleProvider instance
      );
      expect(result).toEqual(mockCredential);
    });

    it('deve propagar erro quando signInWithPopup falha', async () => {
      const error = new Error('Popup closed by user');
      mockSignInWithPopup.mockRejectedValue(error);

      await expect(loginComGoogle()).rejects.toThrow('Popup closed by user');
    });
  });

  describe('logout', () => {
    it('deve chamar signOut com a instância auth', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await logout();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockSignOut).toHaveBeenCalledWith(expect.anything()); // auth instance
    });

    it('deve propagar erro quando signOut falha', async () => {
      const error = new Error('Network error');
      mockSignOut.mockRejectedValue(error);

      await expect(logout()).rejects.toThrow('Network error');
    });
  });

  describe('onAuthChange', () => {
    it('deve chamar onAuthStateChanged com auth e callback', () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
      const callback = jest.fn();

      const unsubscribe = onAuthChange(callback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
        expect.anything(), // auth instance
        callback
      );
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('deve retornar função de unsubscribe funcional', () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthChange(jest.fn());
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('googleProvider', () => {
    it('deve exportar uma instância do GoogleAuthProvider', () => {
      expect(googleProvider).toBeDefined();
      expect(typeof googleProvider).toBe('object');
    });
  });
});
