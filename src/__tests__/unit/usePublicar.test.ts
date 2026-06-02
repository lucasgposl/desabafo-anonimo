/**
 * Testes unitários para o hook usePublicar (src/hooks/usePublicar.ts)
 * Validates: Requirements 1.3, 1.4, 1.7, 1.8, 1.9, 1.11
 */

import { renderHook, act } from '@testing-library/react';
import { criarReacoesZeradas, sentimentoPadrao, todosSentimentos } from '../helpers/fixtureHelper';

// Mocks
const mockCriarDesabafo = jest.fn();

jest.mock('../../firebase/desabafos', () => ({
  criarDesabafo: (...args: unknown[]) => mockCriarDesabafo(...args),
}));

import { usePublicar } from '../../hooks/usePublicar';

describe('usePublicar', () => {
  const uid = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Estado inicial', () => {
    it('deve iniciar com isPublicando false e error null', () => {
      const { result } = renderHook(() => usePublicar(uid));

      expect(result.current.isPublicando).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.publicar).toBeInstanceOf(Function);
    });
  });

  describe('Validação de texto (Req 1.7, 1.8)', () => {
    it('deve rejeitar texto vazio e definir erro', async () => {
      const { result } = renderHook(() => usePublicar(uid));

      let retorno: unknown;
      await act(async () => {
        retorno = await result.current.publicar('', sentimentoPadrao());
      });

      expect(retorno).toBeNull();
      expect(result.current.error).toBe('Escreva algo antes de publicar!');
      expect(mockCriarDesabafo).not.toHaveBeenCalled();
    });

    it('deve rejeitar texto composto apenas de espaços', async () => {
      const { result } = renderHook(() => usePublicar(uid));

      let retorno: unknown;
      await act(async () => {
        retorno = await result.current.publicar('   \t\n  ', sentimentoPadrao());
      });

      expect(retorno).toBeNull();
      expect(result.current.error).toBe('Escreva algo antes de publicar!');
      expect(mockCriarDesabafo).not.toHaveBeenCalled();
    });

    it('deve rejeitar texto com mais de 2000 caracteres', async () => {
      const { result } = renderHook(() => usePublicar(uid));
      const textoLongo = 'a'.repeat(2001);

      let retorno: unknown;
      await act(async () => {
        retorno = await result.current.publicar(textoLongo, sentimentoPadrao());
      });

      expect(retorno).toBeNull();
      expect(result.current.error).toBe('O texto deve ter no máximo 2000 caracteres.');
      expect(mockCriarDesabafo).not.toHaveBeenCalled();
    });

    it('deve aceitar texto com exatamente 2000 caracteres', async () => {
      mockCriarDesabafo.mockResolvedValue('doc-id-1');
      const { result } = renderHook(() => usePublicar(uid));
      const textoExato = 'a'.repeat(2000);

      let retorno: unknown;
      await act(async () => {
        retorno = await result.current.publicar(textoExato, sentimentoPadrao());
      });

      expect(retorno).not.toBeNull();
      expect(mockCriarDesabafo).toHaveBeenCalled();
    });
  });

  describe('Publicação com sucesso (Req 1.3, 1.4, 1.9)', () => {
    it('deve chamar criarDesabafo com texto, sentimento e uid', async () => {
      mockCriarDesabafo.mockResolvedValue('doc-id-abc');
      const { result } = renderHook(() => usePublicar(uid));

      await act(async () => {
        await result.current.publicar('Meu desabafo', sentimentoPadrao());
      });

      expect(mockCriarDesabafo).toHaveBeenCalledWith('Meu desabafo', sentimentoPadrao(), uid);
    });

    it('deve retornar o desabafo criado com dados corretos', async () => {
      mockCriarDesabafo.mockResolvedValue('doc-id-xyz');
      const { result } = renderHook(() => usePublicar(uid));

      let retorno: unknown;
      await act(async () => {
        retorno = await result.current.publicar('Texto do desabafo', sentimentoPadrao());
      });

      expect(retorno).toEqual({
        id: 'doc-id-xyz',
        texto: 'Texto do desabafo',
        sentimento: sentimentoPadrao(),
        criadoEm: expect.any(Date),
        reacoes: criarReacoesZeradas(),
        totalComentarios: 0,
      });
    });

    it('deve definir isPublicando como true durante a publicação', async () => {
      let resolvePromise: (value: string) => void;
      mockCriarDesabafo.mockImplementation(
        () => new Promise<string>((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => usePublicar(uid));

      let publicarPromise: Promise<unknown>;
      act(() => {
        publicarPromise = result.current.publicar('Texto', sentimentoPadrao());
      });

      // Durante a publicação
      expect(result.current.isPublicando).toBe(true);

      // Resolver a promise
      await act(async () => {
        resolvePromise!('doc-id');
        await publicarPromise;
      });

      expect(result.current.isPublicando).toBe(false);
    });

    it('deve limpar erro anterior ao iniciar nova publicação', async () => {
      // Primeiro, causar um erro
      mockCriarDesabafo.mockRejectedValueOnce(new Error('Firestore error'));
      const { result } = renderHook(() => usePublicar(uid));

      await act(async () => {
        await result.current.publicar('Texto válido', sentimentoPadrao());
      });

      expect(result.current.error).toBe('Erro ao publicar. Tente novamente.');

      // Segunda tentativa deve limpar o erro
      mockCriarDesabafo.mockResolvedValueOnce('doc-id-2');

      await act(async () => {
        await result.current.publicar('Outro texto', sentimentoPadrao());
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Falha na publicação (Req 1.11)', () => {
    it('deve definir erro quando criarDesabafo falha', async () => {
      mockCriarDesabafo.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => usePublicar(uid));

      let retorno: unknown;
      await act(async () => {
        retorno = await result.current.publicar('Meu texto', sentimentoPadrao());
      });

      expect(retorno).toBeNull();
      expect(result.current.error).toBe('Erro ao publicar. Tente novamente.');
      expect(result.current.isPublicando).toBe(false);
    });

    it('deve retornar null em caso de falha', async () => {
      mockCriarDesabafo.mockRejectedValue(new Error('Timeout'));
      const { result } = renderHook(() => usePublicar(uid));

      let retorno: unknown;
      await act(async () => {
        retorno = await result.current.publicar('Texto válido', sentimentoPadrao());
      });

      expect(retorno).toBeNull();
    });
  });

  describe('Diferentes sentimentos', () => {
    it.each(todosSentimentos())(
      'deve aceitar sentimento "%s"',
      async (sentimento) => {
        mockCriarDesabafo.mockResolvedValue(`doc-${sentimento}`);
        const { result } = renderHook(() => usePublicar(uid));

        let retorno: unknown;
        await act(async () => {
          retorno = await result.current.publicar('Texto', sentimento);
        });

        expect(retorno).toEqual(
          expect.objectContaining({ sentimento })
        );
      }
    );
  });
});
