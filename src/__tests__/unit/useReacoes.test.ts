/**
 * Testes unitários para o hook useReacoes (src/hooks/useReacoes.ts)
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6
 */

import { renderHook, act } from '@testing-library/react';
import type { Desabafo } from '../../types';

// Mock do serviço Firebase
const mockIncrementarReacao = jest.fn();

jest.mock('../../firebase/desabafos', () => ({
  incrementarReacao: (...args: unknown[]) => mockIncrementarReacao(...args),
}));

import { useReacoes } from '../../hooks/useReacoes';

function criarDesabafoMock(overrides: Partial<Desabafo> = {}): Desabafo {
  return {
    id: 'desabafo-1',
    texto: 'Texto de teste',
    sentimento: 'triste',
    criadoEm: new Date(),
    reacoes: { apoio: 0, forca: 0, pouco: 0 },
    totalComentarios: 0,
    ...overrides,
  };
}

describe('useReacoes', () => {
  let desabafos: Desabafo[];
  let setDesabafos: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    desabafos = [
      criarDesabafoMock({ id: 'desabafo-1', reacoes: { apoio: 5, forca: 3, pouco: 1 } }),
      criarDesabafoMock({ id: 'desabafo-2', reacoes: { apoio: 0, forca: 0, pouco: 0 } }),
    ];
    setDesabafos = jest.fn((updater) => {
      if (typeof updater === 'function') {
        desabafos = updater(desabafos);
      } else {
        desabafos = updater;
      }
    });
  });

  describe('Estado inicial', () => {
    it('deve retornar isReagindo como objeto vazio inicialmente', () => {
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      expect(result.current.isReagindo).toEqual({});
    });

    it('deve retornar função reagir', () => {
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      expect(typeof result.current.reagir).toBe('function');
    });
  });

  describe('Optimistic update (Req 4.3)', () => {
    it('deve incrementar o contador localmente antes da confirmação do Firestore', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', 'apoio');
      });

      // setDesabafos deve ter sido chamado com o incremento
      expect(setDesabafos).toHaveBeenCalled();
      // Verificar que o desabafo foi atualizado
      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes.apoio).toBe(6);
    });

    it('deve incrementar apenas o contador do tipo correto', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', 'forca');
      });

      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes.forca).toBe(4);
      expect(desabafoAtualizado?.reacoes.apoio).toBe(5);
      expect(desabafoAtualizado?.reacoes.pouco).toBe(1);
    });

    it('deve não alterar outros desabafos', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', 'apoio');
      });

      const outroDesabafo = desabafos.find((d) => d.id === 'desabafo-2');
      expect(outroDesabafo?.reacoes.apoio).toBe(0);
      expect(outroDesabafo?.reacoes.forca).toBe(0);
      expect(outroDesabafo?.reacoes.pouco).toBe(0);
    });
  });

  describe('Persistência no Firestore (Req 4.4)', () => {
    it('deve chamar incrementarReacao com desabafoId e tipo corretos', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', 'pouco');
      });

      expect(mockIncrementarReacao).toHaveBeenCalledWith('desabafo-1', 'pouco');
    });
  });

  describe('Múltiplas reações (Req 4.5)', () => {
    it('deve permitir múltiplas reações ao mesmo desabafo', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', 'apoio');
      });

      await act(async () => {
        await result.current.reagir('desabafo-1', 'apoio');
      });

      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes.apoio).toBe(7);
    });
  });

  describe('Rollback em caso de falha (Req 4.6)', () => {
    it('deve reverter o incremento quando o Firestore falha', async () => {
      mockIncrementarReacao.mockRejectedValue(new Error('Firestore error'));
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', 'apoio');
      });

      // Após o rollback, o valor deve voltar ao original
      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes.apoio).toBe(5);
    });

    it('deve reverter apenas o contador do tipo que falhou', async () => {
      mockIncrementarReacao.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', 'forca');
      });

      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes.forca).toBe(3);
      expect(desabafoAtualizado?.reacoes.apoio).toBe(5);
      expect(desabafoAtualizado?.reacoes.pouco).toBe(1);
    });
  });

  describe('Estado isReagindo', () => {
    it('deve marcar isReagindo como true durante a operação', async () => {
      let resolvePromise: () => void;
      mockIncrementarReacao.mockImplementation(
        () => new Promise<void>((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      let promise: Promise<void>;
      act(() => {
        promise = result.current.reagir('desabafo-1', 'apoio');
      });

      expect(result.current.isReagindo['desabafo-1']).toBe(true);

      await act(async () => {
        resolvePromise!();
        await promise!;
      });

      expect(result.current.isReagindo['desabafo-1']).toBe(false);
    });

    it('deve marcar isReagindo como false após falha', async () => {
      mockIncrementarReacao.mockRejectedValue(new Error('Error'));
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', 'apoio');
      });

      expect(result.current.isReagindo['desabafo-1']).toBe(false);
    });
  });
});
