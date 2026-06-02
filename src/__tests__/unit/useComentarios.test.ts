/**
 * Testes unitários para o hook useComentarios (src/hooks/useComentarios.ts)
 * Validates: Requirements 11.2, 11.3, 11.4, 11.6, 11.7, 11.8, 11.9
 */

import { renderHook, act } from '@testing-library/react';

// Mocks
const mockBuscarComentarios = jest.fn();
const mockCriarComentario = jest.fn();

jest.mock('../../firebase/comentarios', () => ({
  buscarComentarios: (...args: unknown[]) => mockBuscarComentarios(...args),
  criarComentario: (...args: unknown[]) => mockCriarComentario(...args),
}));

import { useComentarios } from '../../hooks/useComentarios';
import type { Comentario } from '../../types';

describe('useComentarios', () => {
  const desabafoId = 'desabafo-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Estado inicial', () => {
    it('deve iniciar com lista vazia, isLoading false e totalComentarios 0', () => {
      const { result } = renderHook(() => useComentarios(desabafoId));

      expect(result.current.comentarios).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.totalComentarios).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('carregarComentarios (Req 11.2)', () => {
    it('deve buscar comentários do Firestore com limite 50', async () => {
      const comentariosMock: Comentario[] = [
        { id: 'c1', texto: 'Força!', criadoEm: new Date('2024-01-01'), desabafoId },
        { id: 'c2', texto: 'Estou contigo', criadoEm: new Date('2024-01-02'), desabafoId },
      ];
      mockBuscarComentarios.mockResolvedValue(comentariosMock);

      const { result } = renderHook(() => useComentarios(desabafoId));

      await act(async () => {
        await result.current.carregarComentarios();
      });

      expect(mockBuscarComentarios).toHaveBeenCalledWith(desabafoId, 50);
      expect(result.current.comentarios).toEqual(comentariosMock);
      expect(result.current.totalComentarios).toBe(2);
      expect(result.current.isLoading).toBe(false);
    });

    it('deve definir isLoading false após carregamento concluído', async () => {
      mockBuscarComentarios.mockResolvedValue([]);

      const { result } = renderHook(() => useComentarios(desabafoId));

      await act(async () => {
        await result.current.carregarComentarios();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('deve definir erro quando busca falha', async () => {
      mockBuscarComentarios.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useComentarios(desabafoId));

      await act(async () => {
        await result.current.carregarComentarios();
      });

      expect(result.current.error).toBe('Erro ao carregar comentários. Tente novamente.');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('publicarComentario (Req 11.3, 11.4, 11.6)', () => {
    it('deve criar comentário e inserir na lista local', async () => {
      mockCriarComentario.mockResolvedValue('novo-id-123');

      const { result } = renderHook(() => useComentarios(desabafoId));

      let sucesso: boolean = false;
      await act(async () => {
        sucesso = await result.current.publicarComentario('Força pra você!', 'uid-abc');
      });

      expect(sucesso).toBe(true);
      expect(mockCriarComentario).toHaveBeenCalledWith(desabafoId, 'Força pra você!', 'uid-abc');
      expect(result.current.comentarios).toHaveLength(1);
      expect(result.current.comentarios[0].id).toBe('novo-id-123');
      expect(result.current.comentarios[0].texto).toBe('Força pra você!');
      expect(result.current.comentarios[0].desabafoId).toBe(desabafoId);
      expect(result.current.totalComentarios).toBe(1);
    });

    it('deve incrementar totalComentarios após sucesso', async () => {
      mockCriarComentario.mockResolvedValue('id-1');

      const { result } = renderHook(() => useComentarios(desabafoId));

      await act(async () => {
        await result.current.publicarComentario('Primeiro', 'uid-1');
      });
      expect(result.current.totalComentarios).toBe(1);

      mockCriarComentario.mockResolvedValue('id-2');
      await act(async () => {
        await result.current.publicarComentario('Segundo', 'uid-1');
      });
      expect(result.current.totalComentarios).toBe(2);
    });

    it('deve inserir novo comentário no final da lista (ASC)', async () => {
      const comentariosExistentes: Comentario[] = [
        { id: 'c1', texto: 'Antigo', criadoEm: new Date('2024-01-01'), desabafoId },
      ];
      mockBuscarComentarios.mockResolvedValue(comentariosExistentes);
      mockCriarComentario.mockResolvedValue('c2');

      const { result } = renderHook(() => useComentarios(desabafoId));

      await act(async () => {
        await result.current.carregarComentarios();
      });

      await act(async () => {
        await result.current.publicarComentario('Novo', 'uid-1');
      });

      expect(result.current.comentarios).toHaveLength(2);
      expect(result.current.comentarios[0].texto).toBe('Antigo');
      expect(result.current.comentarios[1].texto).toBe('Novo');
    });
  });

  describe('Validação de texto (Req 11.7, 11.8)', () => {
    it('deve rejeitar texto vazio e definir erro', async () => {
      const { result } = renderHook(() => useComentarios(desabafoId));

      let sucesso: boolean = true;
      await act(async () => {
        sucesso = await result.current.publicarComentario('', 'uid-1');
      });

      expect(sucesso).toBe(false);
      expect(result.current.error).toBe('Escreva algo antes de publicar!');
      expect(mockCriarComentario).not.toHaveBeenCalled();
    });

    it('deve rejeitar texto com apenas espaços', async () => {
      const { result } = renderHook(() => useComentarios(desabafoId));

      let sucesso: boolean = true;
      await act(async () => {
        sucesso = await result.current.publicarComentario('   \n\t  ', 'uid-1');
      });

      expect(sucesso).toBe(false);
      expect(result.current.error).toBe('Escreva algo antes de publicar!');
      expect(mockCriarComentario).not.toHaveBeenCalled();
    });

    it('deve rejeitar texto com mais de 500 caracteres', async () => {
      const textoLongo = 'a'.repeat(501);
      const { result } = renderHook(() => useComentarios(desabafoId));

      let sucesso: boolean = true;
      await act(async () => {
        sucesso = await result.current.publicarComentario(textoLongo, 'uid-1');
      });

      expect(sucesso).toBe(false);
      expect(result.current.error).toBe('O comentário deve ter no máximo 500 caracteres.');
      expect(mockCriarComentario).not.toHaveBeenCalled();
    });

    it('deve aceitar texto com exatamente 500 caracteres', async () => {
      const textoExato = 'a'.repeat(500);
      mockCriarComentario.mockResolvedValue('id-ok');

      const { result } = renderHook(() => useComentarios(desabafoId));

      let sucesso: boolean = false;
      await act(async () => {
        sucesso = await result.current.publicarComentario(textoExato, 'uid-1');
      });

      expect(sucesso).toBe(true);
      expect(mockCriarComentario).toHaveBeenCalled();
    });
  });

  describe('Erro ao publicar (Req 11.9)', () => {
    it('deve definir erro quando Firestore falha e retornar false', async () => {
      mockCriarComentario.mockRejectedValue(new Error('Firestore error'));

      const { result } = renderHook(() => useComentarios(desabafoId));

      let sucesso: boolean = true;
      await act(async () => {
        sucesso = await result.current.publicarComentario('Texto válido', 'uid-1');
      });

      expect(sucesso).toBe(false);
      expect(result.current.error).toBe('Erro ao publicar comentário. Tente novamente.');
      expect(result.current.comentarios).toHaveLength(0);
      expect(result.current.totalComentarios).toBe(0);
    });

    it('deve limpar erro anterior ao tentar publicar novamente', async () => {
      mockCriarComentario.mockRejectedValueOnce(new Error('Firestore error'));

      const { result } = renderHook(() => useComentarios(desabafoId));

      await act(async () => {
        await result.current.publicarComentario('Texto válido', 'uid-1');
      });
      expect(result.current.error).not.toBeNull();

      mockCriarComentario.mockResolvedValueOnce('id-ok');
      await act(async () => {
        await result.current.publicarComentario('Texto válido', 'uid-1');
      });
      expect(result.current.error).toBeNull();
    });
  });
});
