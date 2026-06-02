import { renderHook, waitFor } from '@testing-library/react';
import { useAdmin } from '../../hooks/useAdmin';

// Mock do módulo firebase/admin
jest.mock('../../firebase/admin', () => ({
  verificarAdmin: jest.fn(),
}));

import { verificarAdmin } from '../../firebase/admin';

const mockVerificarAdmin = verificarAdmin as jest.MockedFunction<typeof verificarAdmin>;

describe('useAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna isAdmin: false e isLoading: false quando uid é null', () => {
    const { result } = renderHook(() => useAdmin(null));

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockVerificarAdmin).not.toHaveBeenCalled();
  });

  it('retorna isAdmin: true quando uid é de um admin', async () => {
    mockVerificarAdmin.mockResolvedValue(true);

    const { result } = renderHook(() => useAdmin('admin-uid-123'));

    // Inicialmente está carregando
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(mockVerificarAdmin).toHaveBeenCalledWith('admin-uid-123');
  });

  it('retorna isAdmin: false quando uid não é admin', async () => {
    mockVerificarAdmin.mockResolvedValue(false);

    const { result } = renderHook(() => useAdmin('user-uid-456'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(mockVerificarAdmin).toHaveBeenCalledWith('user-uid-456');
  });

  it('retorna isAdmin: false em caso de erro na consulta', async () => {
    mockVerificarAdmin.mockRejectedValue(new Error('Firestore error'));

    const { result } = renderHook(() => useAdmin('user-uid-789'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('re-verifica quando uid muda', async () => {
    mockVerificarAdmin.mockResolvedValue(false);

    const { result, rerender } = renderHook(
      ({ uid }) => useAdmin(uid),
      { initialProps: { uid: 'user-1' as string | null } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);

    // Muda para um uid de admin
    mockVerificarAdmin.mockResolvedValue(true);
    rerender({ uid: 'admin-uid' });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(mockVerificarAdmin).toHaveBeenCalledWith('admin-uid');
  });

  it('reseta para isAdmin: false quando uid muda para null', async () => {
    mockVerificarAdmin.mockResolvedValue(true);

    const { result, rerender } = renderHook(
      ({ uid }) => useAdmin(uid),
      { initialProps: { uid: 'admin-uid' as string | null } }
    );

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });

    // Muda para null (logout)
    rerender({ uid: null });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});
