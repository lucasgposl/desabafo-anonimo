/**
 * Testes unitários para o hook useDesabafo (src/hooks/useDesabafo.ts)
 * Validates: Requirements 2.2, 5.1, 5.3
 */

import { renderHook, waitFor } from '@testing-library/react';
import { sentimentoPadrao, criarReacoesMock, criarReacoesZeradas } from '../helpers/fixtureHelper';

// Mocks do Firestore
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockCollection = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

jest.mock('../../firebase/config', () => ({
  db: {},
}));

import { useDesabafo } from '../../hooks/useDesabafo';

describe('useDesabafo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReturnValue('mock-query');
    mockCollection.mockReturnValue('mock-collection');
    mockWhere.mockReturnValue('mock-where');
  });

  describe('Validação de numero inválido (Req 5.3)', () => {
    it('deve retornar naoEncontrado para NaN', async () => {
      const { result } = renderHook(() => useDesabafo(NaN));

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.naoEncontrado).toBe(true);
      expect(result.current.desabafo).toBeNull();
      expect(result.current.erro).toBeNull();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('deve retornar naoEncontrado para numero negativo', async () => {
      const { result } = renderHook(() => useDesabafo(-1));

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.naoEncontrado).toBe(true);
      expect(result.current.desabafo).toBeNull();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('deve retornar naoEncontrado para numero zero', async () => {
      const { result } = renderHook(() => useDesabafo(0));

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.naoEncontrado).toBe(true);
      expect(result.current.desabafo).toBeNull();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('deve retornar naoEncontrado para Infinity', async () => {
      const { result } = renderHook(() => useDesabafo(Infinity));

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.naoEncontrado).toBe(true);
      expect(result.current.desabafo).toBeNull();
      expect(mockGetDocs).not.toHaveBeenCalled();
    });
  });

  describe('Busca com numero válido (Req 2.2)', () => {
    it('deve buscar e retornar desabafo encontrado', async () => {
      const mockData = {
        texto: 'Meu desabafo',
        sentimento: sentimentoPadrao(),
        criadoEm: { toDate: () => new Date('2024-01-01') },
        reacoes: criarReacoesMock({ apoio: 5, forca: 2, pouco: 1 }),
        totalComentarios: 3,
        numero: 42,
      };

      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'doc-abc', data: () => mockData }],
      });

      const { result } = renderHook(() => useDesabafo(42));

      // Inicialmente carregando
      expect(result.current.carregando).toBe(true);

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.desabafo).toEqual({
        id: 'doc-abc',
        texto: 'Meu desabafo',
        sentimento: sentimentoPadrao(),
        criadoEm: new Date('2024-01-01'),
        reacoes: criarReacoesMock({ apoio: 5, forca: 2, pouco: 1 }),
        totalComentarios: 3,
        numero: 42,
      });
      expect(result.current.naoEncontrado).toBe(false);
      expect(result.current.erro).toBeNull();
      expect(mockWhere).toHaveBeenCalledWith('numero', '==', 42);
    });

    it('deve retornar naoEncontrado quando desabafo não existe (Req 5.1)', async () => {
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const { result } = renderHook(() => useDesabafo(999));

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.naoEncontrado).toBe(true);
      expect(result.current.desabafo).toBeNull();
      expect(result.current.erro).toBeNull();
    });

    it('deve tratar erro de busca', async () => {
      mockGetDocs.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDesabafo(1));

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.erro).toBe('Erro ao carregar o desabafo.');
      expect(result.current.desabafo).toBeNull();
      expect(result.current.naoEncontrado).toBe(false);
    });

    it('deve tratar criadoEm ausente com fallback para new Date()', async () => {
      const mockData = {
        texto: 'Desabafo sem timestamp',
        sentimento: sentimentoPadrao(),
        criadoEm: null,
        reacoes: criarReacoesZeradas(),
        totalComentarios: 0,
        numero: 1,
      };

      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'doc-xyz', data: () => mockData }],
      });

      const { result } = renderHook(() => useDesabafo(1));

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.desabafo).not.toBeNull();
      expect(result.current.desabafo!.criadoEm).toBeInstanceOf(Date);
    });
  });

  describe('Reatividade ao mudar numero', () => {
    it('deve refazer busca quando numero muda', async () => {
      const mockData1 = {
        texto: 'Desabafo 1',
        sentimento: sentimentoPadrao(),
        criadoEm: { toDate: () => new Date('2024-01-01') },
        reacoes: criarReacoesZeradas(),
        totalComentarios: 0,
        numero: 1,
      };

      const mockData2 = {
        texto: 'Desabafo 2',
        sentimento: sentimentoPadrao(),
        criadoEm: { toDate: () => new Date('2024-02-01') },
        reacoes: criarReacoesMock({ apoio: 10, forca: 5, pouco: 2 }),
        totalComentarios: 7,
        numero: 2,
      };

      mockGetDocs
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'doc-1', data: () => mockData1 }],
        })
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'doc-2', data: () => mockData2 }],
        });

      const { result, rerender } = renderHook(
        ({ numero }: { numero: number }) => useDesabafo(numero),
        { initialProps: { numero: 1 } }
      );

      await waitFor(() => {
        expect(result.current.carregando).toBe(false);
      });

      expect(result.current.desabafo?.texto).toBe('Desabafo 1');

      rerender({ numero: 2 });

      await waitFor(() => {
        expect(result.current.desabafo?.texto).toBe('Desabafo 2');
      });

      expect(mockGetDocs).toHaveBeenCalledTimes(2);
    });
  });
});
