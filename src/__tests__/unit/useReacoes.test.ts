/**
 * Testes unitários para o hook useReacoes (src/hooks/useReacoes.ts)
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6
 */

import { renderHook, act } from '@testing-library/react';
import type { Desabafo, TipoReacao } from '../../types';
import { REACAO_CONFIG } from '../../config/sentimentos';
import {
  sentimentoPadrao,
  criarReacoesZeradas,
  criarReacoesMock,
} from '../helpers/fixtureHelper';

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
    sentimento: sentimentoPadrao(),
    criadoEm: new Date(),
    reacoes: criarReacoesZeradas(),
    totalComentarios: 0,
    ...overrides,
  };
}

// Chaves de reação da config atual — usadas como referência nos assertions de incremento
const reacaoKeys = Object.keys(REACAO_CONFIG) as TipoReacao[];
const REACAO_KEY_0 = reacaoKeys[0]; // primeira reação da config
const REACAO_KEY_1 = reacaoKeys[1]; // segunda reação da config
const REACAO_KEY_2 = reacaoKeys[2]; // terceira reação da config

describe('useReacoes', () => {
  let desabafos: Desabafo[];
  let setDesabafos: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    desabafos = [
      criarDesabafoMock({ id: 'desabafo-1', reacoes: criarReacoesMock({ [REACAO_KEY_0]: 5, [REACAO_KEY_1]: 3, [REACAO_KEY_2]: 1 }) }),
      criarDesabafoMock({ id: 'desabafo-2', reacoes: criarReacoesZeradas() }),
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
        await result.current.reagir('desabafo-1', REACAO_KEY_0);
      });

      // setDesabafos deve ter sido chamado com o incremento
      expect(setDesabafos).toHaveBeenCalled();
      // Verificar que o desabafo foi atualizado
      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_0]).toBe(6);
    });

    it('deve incrementar apenas o contador do tipo correto', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_1);
      });

      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_1]).toBe(4);
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_0]).toBe(5);
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_2]).toBe(1);
    });

    it('deve não alterar outros desabafos', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_0);
      });

      const outroDesabafo = desabafos.find((d) => d.id === 'desabafo-2');
      expect(outroDesabafo?.reacoes[REACAO_KEY_0]).toBe(0);
      expect(outroDesabafo?.reacoes[REACAO_KEY_1]).toBe(0);
      expect(outroDesabafo?.reacoes[REACAO_KEY_2]).toBe(0);
    });
  });

  describe('Persistência no Firestore (Req 4.4)', () => {
    it('deve chamar incrementarReacao com desabafoId e tipo corretos', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_2);
      });

      expect(mockIncrementarReacao).toHaveBeenCalledWith('desabafo-1', REACAO_KEY_2);
    });
  });

  describe('Troca de reação (Req 3.4) e idempotência (Req 3.5)', () => {
    it('deve ignorar re-clique na mesma reação (idempotência)', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      // Primeira reação
      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_0);
      });

      // Re-clique na mesma reação — deve ser ignorado
      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_0);
      });

      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      // Deve ter incrementado apenas 1 vez (5 + 1 = 6), não 7
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_0]).toBe(6);
    });

    it('deve trocar reação: decrementar anterior e incrementar nova', async () => {
      mockIncrementarReacao.mockResolvedValue(undefined);
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      // Primeira reação em REACAO_KEY_0
      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_0);
      });

      // Trocar para REACAO_KEY_1
      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_1);
      });

      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      // REACAO_KEY_0: 5 + 1 (first click) - 1 (swap decrement) = 5
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_0]).toBe(5);
      // REACAO_KEY_1: 3 + 1 (swap increment) = 4
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_1]).toBe(4);
    });
  });

  describe('Rollback em caso de falha (Req 4.6)', () => {
    it('deve reverter o incremento quando o Firestore falha', async () => {
      mockIncrementarReacao.mockRejectedValue(new Error('Firestore error'));
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_0);
      });

      // Após o rollback, o valor deve voltar ao original
      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_0]).toBe(5);
    });

    it('deve reverter apenas o contador do tipo que falhou', async () => {
      mockIncrementarReacao.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useReacoes(desabafos, setDesabafos));

      await act(async () => {
        await result.current.reagir('desabafo-1', REACAO_KEY_1);
      });

      const desabafoAtualizado = desabafos.find((d) => d.id === 'desabafo-1');
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_1]).toBe(3);
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_0]).toBe(5);
      expect(desabafoAtualizado?.reacoes[REACAO_KEY_2]).toBe(1);
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
        promise = result.current.reagir('desabafo-1', REACAO_KEY_0);
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
        await result.current.reagir('desabafo-1', REACAO_KEY_0);
      });

      expect(result.current.isReagindo['desabafo-1']).toBe(false);
    });
  });
});
