/**
 * Testes unitários para o carregamento lazy de comentários na PaginaModeracao
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks
const mockBuscarTodosDesabafosAdmin = jest.fn();
const mockBuscarTodosAdmins = jest.fn();
const mockBuscarDesabafoAdminPorNumero = jest.fn();
const mockBuscarComentarios = jest.fn();
const mockRemoverDesabafo = jest.fn();
const mockRemoverComentario = jest.fn();
const mockApagarTodosDesabafos = jest.fn();
const mockAdicionarAdmin = jest.fn();
const mockRemoverAdmin = jest.fn();

jest.mock('../../firebase/admin', () => ({
  buscarTodosDesabafosAdmin: (...args: unknown[]) => mockBuscarTodosDesabafosAdmin(...args),
  buscarTodosAdmins: (...args: unknown[]) => mockBuscarTodosAdmins(...args),
  adicionarAdmin: (...args: unknown[]) => mockAdicionarAdmin(...args),
  removerAdmin: (...args: unknown[]) => mockRemoverAdmin(...args),
  buscarDesabafoAdminPorNumero: (...args: unknown[]) => mockBuscarDesabafoAdminPorNumero(...args),
}));

jest.mock('../../firebase/desabafos', () => ({
  removerDesabafo: (...args: unknown[]) => mockRemoverDesabafo(...args),
  apagarTodosDesabafos: (...args: unknown[]) => mockApagarTodosDesabafos(...args),
}));

jest.mock('../../firebase/comentarios', () => ({
  buscarComentarios: (...args: unknown[]) => mockBuscarComentarios(...args),
  removerComentario: (...args: unknown[]) => mockRemoverComentario(...args),
}));

import { PaginaModeracao } from '../../components/PaginaModeracao';
import type { DesabafoAdmin, Comentario } from '../../types';
import { criarReacoesMock, sentimentoPadrao } from '../helpers/fixtureHelper';

const criarDesabafoMock = (overrides: Partial<DesabafoAdmin> = {}): DesabafoAdmin => ({
  id: 'desabafo-1',
  texto: 'Texto do desabafo de teste',
  sentimento: sentimentoPadrao(),
  criadoEm: new Date('2024-06-01'),
  uid: 'uid-autor',
  reacoes: criarReacoesMock(),
  totalComentarios: 3,
  ...overrides,
});

const criarComentarioMock = (overrides: Partial<Comentario> = {}): Comentario => ({
  id: 'comentario-1',
  texto: 'Comentário de teste',
  criadoEm: new Date('2024-06-02'),
  desabafoId: 'desabafo-1',
  ...overrides,
});

describe('PaginaModeracao - Carregamento lazy de comentários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuscarTodosDesabafosAdmin.mockResolvedValue({
      desabafos: [criarDesabafoMock()],
      ultimoDoc: null,
    });
    mockBuscarTodosAdmins.mockResolvedValue([]);
  });

  describe('Req 2.2 - Buscar comentários na primeira expansão', () => {
    it('deve chamar buscarComentarios ao expandir pela primeira vez', async () => {
      const comentarios = [criarComentarioMock()];
      mockBuscarComentarios.mockResolvedValue(comentarios);

      render(<PaginaModeracao isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText(/3 comentários/)).toBeInTheDocument();
      });

      const toggleBtn = screen.getByRole('button', { name: /3 comentários/ });
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      await waitFor(() => {
        expect(mockBuscarComentarios).toHaveBeenCalledWith('desabafo-1');
        expect(mockBuscarComentarios).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Req 2.3 - Reutilizar cache na reexpansão', () => {
    it('não deve buscar novamente ao reexpandir uma linha já carregada', async () => {
      const comentarios = [criarComentarioMock()];
      mockBuscarComentarios.mockResolvedValue(comentarios);

      render(<PaginaModeracao isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText(/3 comentários/)).toBeInTheDocument();
      });

      const toggleBtn = screen.getByRole('button', { name: /3 comentários/ });

      // First expand
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      await waitFor(() => {
        expect(screen.getByText(/Comentário de teste/)).toBeInTheDocument();
      });

      expect(mockBuscarComentarios).toHaveBeenCalledTimes(1);

      // Collapse
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      // Re-expand — should NOT fetch again
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      expect(mockBuscarComentarios).toHaveBeenCalledTimes(1);
    });
  });

  describe('Req 2.4 - Indicador de carregamento', () => {
    it('deve exibir indicador de carregamento enquanto busca comentários', async () => {
      let resolveComentarios!: (value: Comentario[]) => void;
      mockBuscarComentarios.mockImplementation(
        () => new Promise<Comentario[]>((resolve) => { resolveComentarios = resolve; })
      );

      render(<PaginaModeracao isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText(/3 comentários/)).toBeInTheDocument();
      });

      const toggleBtn = screen.getByRole('button', { name: /3 comentários/ });
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      // Should show loading indicator inside the expanded row
      expect(screen.getByText('Carregando comentários...')).toBeInTheDocument();

      // Resolve the fetch
      await act(async () => {
        resolveComentarios([criarComentarioMock()]);
      });

      // Loading indicator should disappear
      await waitFor(() => {
        expect(screen.queryByText('Carregando comentários...')).not.toBeInTheDocument();
      });
    });

    it('deve exibir "carregando..." no botão toggle durante o carregamento', async () => {
      let resolveComentarios!: (value: Comentario[]) => void;
      mockBuscarComentarios.mockImplementation(
        () => new Promise<Comentario[]>((resolve) => { resolveComentarios = resolve; })
      );

      render(<PaginaModeracao isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText(/3 comentários/)).toBeInTheDocument();
      });

      const toggleBtn = screen.getByRole('button', { name: /3 comentários/ });
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      // Toggle button should show loading state text
      expect(screen.getByText('carregando...')).toBeInTheDocument();

      // Resolve
      await act(async () => {
        resolveComentarios([criarComentarioMock()]);
      });

      await waitFor(() => {
        expect(screen.queryByText('carregando...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Req 2.5 - Erro mantém toggle ativo para retry', () => {
    it('deve exibir mensagem de erro dentro da linha se a busca falhar', async () => {
      mockBuscarComentarios.mockRejectedValue(new Error('Network error'));

      render(<PaginaModeracao isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText(/3 comentários/)).toBeInTheDocument();
      });

      const toggleBtn = screen.getByRole('button', { name: /3 comentários/ });
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar comentários.')).toBeInTheDocument();
      });
    });

    it('deve manter a linha expandida (toggle ativo) após erro', async () => {
      mockBuscarComentarios.mockRejectedValue(new Error('Network error'));

      render(<PaginaModeracao isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText(/3 comentários/)).toBeInTheDocument();
      });

      const toggleBtn = screen.getByRole('button', { name: /3 comentários/ });
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar comentários.')).toBeInTheDocument();
      });

      // Toggle button should still be enabled and show expanded state
      expect(toggleBtn).not.toBeDisabled();
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    });

    it('deve limpar erro e refazer busca ao reexpandir após erro', async () => {
      // First call fails
      mockBuscarComentarios.mockRejectedValueOnce(new Error('Network error'));

      render(<PaginaModeracao isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText(/3 comentários/)).toBeInTheDocument();
      });

      const toggleBtn = screen.getByRole('button', { name: /3 comentários/ });

      // First expand - will fail
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar comentários.')).toBeInTheDocument();
      });

      // Collapse
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      // Second call succeeds
      mockBuscarComentarios.mockResolvedValueOnce([criarComentarioMock()]);

      // Re-expand - should retry
      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      expect(mockBuscarComentarios).toHaveBeenCalledTimes(2);

      await waitFor(() => {
        expect(screen.queryByText('Erro ao carregar comentários.')).not.toBeInTheDocument();
        expect(screen.getByText(/Comentário de teste/)).toBeInTheDocument();
      });
    });
  });
});
