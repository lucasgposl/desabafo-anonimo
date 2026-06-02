/**
 * Testes unitários para o hook useDesabafos (src/hooks/useDesabafos.ts)
 * Validates: Requirements 2.1, 2.5, 3.2, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import type { Desabafo, Sentimento } from '../../types';
import { sentimentoPadrao, criarReacoesZeradas } from '../helpers/fixtureHelper';

// Mocks
const mockBuscarDesabafos = jest.fn();
const mockOperacaoSegura = jest.fn();

jest.mock('../../firebase/desabafos', () => ({
  buscarDesabafos: (...args: unknown[]) => mockBuscarDesabafos(...args),
  operacaoSegura: (...args: unknown[]) => mockOperacaoSegura(...args),
}));

import { useDesabafos } from '../../hooks/useDesabafos';

function criarDesabafoMock(overrides: Partial<Desabafo> = {}): Desabafo {
  return {
    id: `desabafo-${Math.random().toString(36).slice(2)}`,
    texto: 'Texto de teste',
    sentimento: sentimentoPadrao(),
    criadoEm: new Date(),
    reacoes: criarReacoesZeradas(),
    totalComentarios: 0,
    ...overrides,
  };
}

function criarListaDesabafos(quantidade: number): Desabafo[] {
  return Array.from({ length: quantidade }, (_, i) =>
    criarDesabafoMock({ id: `desabafo-${i}` })
  );
}

describe('useDesabafos', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: operacaoSegura executa a operação normalmente
    mockOperacaoSegura.mockImplementation(
      async (operacao: () => Promise<unknown>) => {
        try {
          return await operacao();
        } catch {
          return null;
        }
      }
    );
  });

  describe('Estado inicial e carregamento (Req 6.2, 6.3)', () => {
    it('deve iniciar com isLoading true e desabafos vazio', () => {
      mockBuscarDesabafos.mockResolvedValue({
        desabafos: [],
        ultimoDoc: null,
      });

      const { result } = renderHook(() => useDesabafos('todos'));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.desabafos).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('deve buscar desabafos na montagem', async () => {
      const desabafos = criarListaDesabafos(5);
      mockBuscarDesabafos.mockResolvedValue({
        desabafos,
        ultimoDoc: { id: 'last' },
      });

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.desabafos).toEqual(desabafos);
      expect(result.current.total).toBe(5);
      expect(mockBuscarDesabafos).toHaveBeenCalledWith('todos', 20, undefined);
    });

    it('deve definir hasMore como true quando retorna exatamente 20 itens', async () => {
      const desabafos = criarListaDesabafos(20);
      mockBuscarDesabafos.mockResolvedValue({
        desabafos,
        ultimoDoc: { id: 'last' },
      });

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);
    });

    it('deve definir hasMore como false quando retorna menos de 20 itens', async () => {
      const desabafos = criarListaDesabafos(10);
      mockBuscarDesabafos.mockResolvedValue({
        desabafos,
        ultimoDoc: { id: 'last' },
      });

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('Paginação com loadMore (Req 2.5)', () => {
    it('deve carregar mais desabafos usando cursor', async () => {
      const primeiraPagina = criarListaDesabafos(20);
      const segundaPagina = criarListaDesabafos(5);
      const mockLastDoc = { id: 'cursor-doc' };

      mockBuscarDesabafos
        .mockResolvedValueOnce({
          desabafos: primeiraPagina,
          ultimoDoc: mockLastDoc,
        })
        .mockResolvedValueOnce({
          desabafos: segundaPagina,
          ultimoDoc: null,
        });

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);

      await act(async () => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.desabafos).toHaveLength(25);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.total).toBe(25);
      expect(mockBuscarDesabafos).toHaveBeenCalledWith('todos', 20, mockLastDoc);
    });

    it('não deve carregar mais quando isLoading é true', async () => {
      mockBuscarDesabafos.mockResolvedValue({
        desabafos: criarListaDesabafos(20),
        ultimoDoc: { id: 'cursor' },
      });

      const { result } = renderHook(() => useDesabafos('todos'));

      // Enquanto está carregando, loadMore não deve disparar nova busca
      act(() => {
        result.current.loadMore();
      });

      // Apenas a chamada inicial deve ter sido feita
      expect(mockBuscarDesabafos).toHaveBeenCalledTimes(1);
    });

    it('não deve carregar mais quando hasMore é false', async () => {
      mockBuscarDesabafos.mockResolvedValue({
        desabafos: criarListaDesabafos(10),
        ultimoDoc: { id: 'cursor' },
      });

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);

      act(() => {
        result.current.loadMore();
      });

      // Apenas a chamada inicial
      expect(mockBuscarDesabafos).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filtro por sentimento (Req 3.2)', () => {
    it('deve reiniciar paginação quando filtro muda', async () => {
      mockBuscarDesabafos.mockResolvedValue({
        desabafos: criarListaDesabafos(5),
        ultimoDoc: null,
      });

      const { result, rerender } = renderHook(
        ({ filtro }: { filtro: Sentimento | 'todos' }) => useDesabafos(filtro),
        { initialProps: { filtro: 'todos' as Sentimento | 'todos' } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mudar filtro
      mockBuscarDesabafos.mockResolvedValue({
        desabafos: criarListaDesabafos(3),
        ultimoDoc: null,
      });

      rerender({ filtro: sentimentoPadrao() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.desabafos).toHaveLength(3);
      expect(result.current.total).toBe(3);
      expect(mockBuscarDesabafos).toHaveBeenLastCalledWith(sentimentoPadrao(), 20, undefined);
    });

    it('deve passar filtro correto para buscarDesabafos', async () => {
      mockBuscarDesabafos.mockResolvedValue({
        desabafos: [],
        ultimoDoc: null,
      });

      renderHook(() => useDesabafos(sentimentoPadrao()));

      await waitFor(() => {
        expect(mockBuscarDesabafos).toHaveBeenCalledWith(sentimentoPadrao(), 20, undefined);
      });
    });
  });

  describe('Tratamento de erros (Req 6.4, 6.5)', () => {
    it('deve definir erro quando operacaoSegura retorna null', async () => {
      mockOperacaoSegura.mockResolvedValue(null);

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Não foi possível carregar os desabafos.');
      expect(result.current.desabafos).toEqual([]);
    });

    it('deve limpar erro ao chamar refresh', async () => {
      // Primeira chamada falha
      mockOperacaoSegura.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.error).toBe('Não foi possível carregar os desabafos.');
      });

      // Refresh com sucesso
      mockOperacaoSegura.mockImplementationOnce(
        async (operacao: () => Promise<unknown>) => operacao()
      );
      mockBuscarDesabafos.mockResolvedValueOnce({
        desabafos: criarListaDesabafos(3),
        ultimoDoc: null,
      });

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.desabafos).toHaveLength(3);
    });
  });

  describe('Refresh (Req 6.6)', () => {
    it('deve reiniciar busca desde o início', async () => {
      mockBuscarDesabafos.mockResolvedValue({
        desabafos: criarListaDesabafos(5),
        ultimoDoc: null,
      });

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockBuscarDesabafos.mockResolvedValueOnce({
        desabafos: criarListaDesabafos(8),
        ultimoDoc: null,
      });

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.desabafos).toHaveLength(8);
      expect(result.current.total).toBe(8);
    });
  });

  describe('inserirNoTopo', () => {
    it('deve inserir desabafo no topo da lista', async () => {
      const desabafosExistentes = criarListaDesabafos(3);
      mockBuscarDesabafos.mockResolvedValue({
        desabafos: desabafosExistentes,
        ultimoDoc: null,
      });

      const { result } = renderHook(() => useDesabafos('todos'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const novoDesabafo = criarDesabafoMock({ id: 'novo-desabafo', texto: 'Novo!' });

      act(() => {
        result.current.inserirNoTopo(novoDesabafo);
      });

      expect(result.current.desabafos[0]).toEqual(novoDesabafo);
      expect(result.current.desabafos).toHaveLength(4);
      expect(result.current.total).toBe(4);
    });
  });
});
