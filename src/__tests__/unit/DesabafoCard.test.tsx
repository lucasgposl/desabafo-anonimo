import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { DesabafoCard } from '../../components/DesabafoCard';
import { Desabafo } from '../../types';

// Mock firebase/comentarios to prevent real Firebase calls when ComentarioSection renders
jest.mock('../../firebase/comentarios', () => ({
  buscarComentarios: jest.fn().mockResolvedValue([]),
  criarComentario: jest.fn().mockResolvedValue('mock-id'),
}));

function criarDesabafoMock(overrides: Partial<Desabafo> = {}): Desabafo {
  return {
    id: 'abc123',
    texto: 'Este é um desabafo de teste.',
    sentimento: 'triste',
    criadoEm: new Date('2024-01-15T10:00:00Z'),
    reacoes: { apoio: 5, forca: 3, pouco: 1 },
    totalComentarios: 0,
    ...overrides,
  };
}

function renderComRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('DesabafoCard', () => {
  const mockOnReagir = jest.fn();

  beforeEach(() => {
    mockOnReagir.mockClear();
  });

  it('renderiza o texto do desabafo', () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.getByText('Este é um desabafo de teste.')).toBeInTheDocument();
  });

  it('renderiza o tempo relativo da publicação', () => {
    const agora = new Date();
    const desabafo = criarDesabafoMock({ criadoEm: new Date(agora.getTime() - 30000) });
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.getByText('agora')).toBeInTheDocument();
  });

  it('aplica borda lateral azul para sentimento triste', () => {
    const desabafo = criarDesabafoMock({ sentimento: 'triste' });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-tristeza)' });
  });

  it('aplica borda lateral vermelha para sentimento raiva', () => {
    const desabafo = criarDesabafoMock({ sentimento: 'raiva' });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-raiva)' });
  });

  it('aplica borda lateral verde para sentimento alivio', () => {
    const desabafo = criarDesabafoMock({ sentimento: 'alivio' });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-alivio)' });
  });

  it('renderiza três botões de reação com contadores', () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.getByText('Eu me identifiquei')).toBeInTheDocument();
    expect(screen.getByText('Força')).toBeInTheDocument();
    expect(screen.getByText('Eu acho é pouco')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('chama onReagir com "apoio" ao clicar em "Eu me identifiquei"', () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText('Eu me identifiquei'));
    expect(mockOnReagir).toHaveBeenCalledWith('apoio');
  });

  it('chama onReagir com "forca" ao clicar em "Força"', () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText('Força'));
    expect(mockOnReagir).toHaveBeenCalledWith('forca');
  });

  it('chama onReagir com "pouco" ao clicar em "Eu acho é pouco"', () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText('Eu acho é pouco'));
    expect(mockOnReagir).toHaveBeenCalledWith('pouco');
  });

  it('renderiza seção de comentários diretamente quando totalComentarios > 0', () => {
    const desabafo = criarDesabafoMock({ totalComentarios: 2 });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(container.querySelector('.desabafo-card__comentarios-section')).toBeInTheDocument();
  });

  it('renderiza seção de comentários mesmo quando totalComentarios === 0', () => {
    const desabafo = criarDesabafoMock({ totalComentarios: 0 });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(container.querySelector('.desabafo-card__comentarios-section')).toBeInTheDocument();
  });

  it('renderiza LinkVerMais quando totalComentarios > 5 e numero definido', () => {
    const desabafo = criarDesabafoMock({ totalComentarios: 10, numero: 42 });
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.getByText('ver mais')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todos os comentários' })).toHaveAttribute('href', '/desabafo/42');
  });

  it('não renderiza LinkVerMais quando totalComentarios > 5 mas numero indefinido', () => {
    const desabafo = criarDesabafoMock({ totalComentarios: 10 });
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.queryByText('ver mais')).not.toBeInTheDocument();
  });

  it('não renderiza LinkVerMais quando totalComentarios <= 5', () => {
    const desabafo = criarDesabafoMock({ totalComentarios: 5, numero: 10 });
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.queryByText('ver mais')).not.toBeInTheDocument();
  });

  it('exibe contadores de reação zerados para desabafo sem reações', () => {
    const desabafo = criarDesabafoMock({ reacoes: { apoio: 0, forca: 0, pouco: 0 } });
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const contadores = screen.getAllByText('0');
    expect(contadores).toHaveLength(3);
  });

  it('não renderiza botão de toggle de comentários', () => {
    const desabafo = criarDesabafoMock({ totalComentarios: 5 });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(container.querySelector('.desabafo-card__comentarios-toggle')).not.toBeInTheDocument();
    expect(container.querySelector('.desabafo-card__comentarios-btn')).not.toBeInTheDocument();
  });

  describe('badge de numero (#N)', () => {
    it('exibe badge #N quando desabafo.numero está definido', () => {
      const desabafo = criarDesabafoMock({ numero: 42 });
      const { container } = renderComRouter(
        <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
      );
      const badge = container.querySelector('.desabafo-card__numero');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('#42');
    });

    it('não exibe badge quando desabafo.numero é undefined (legado)', () => {
      const desabafo = criarDesabafoMock(); // numero undefined
      const { container } = renderComRouter(
        <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
      );
      const badge = container.querySelector('.desabafo-card__numero');
      expect(badge).not.toBeInTheDocument();
    });

    it('exibe badge com numero 1 corretamente', () => {
      const desabafo = criarDesabafoMock({ numero: 1 });
      const { container } = renderComRouter(
        <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
      );
      const badge = container.querySelector('.desabafo-card__numero');
      expect(badge).toHaveTextContent('#1');
    });
  });

  describe('onVerDesabafo (navegação pelo card)', () => {
    const mockOnVerDesabafo = jest.fn();

    beforeEach(() => {
      mockOnVerDesabafo.mockClear();
    });

    it('torna o conteúdo do card clicável quando onVerDesabafo e numero estão definidos', () => {
      const desabafo = criarDesabafoMock({ numero: 7 });
      const { container } = renderComRouter(
        <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} onVerDesabafo={mockOnVerDesabafo} />
      );
      const conteudo = container.querySelector('.desabafo-card__conteudo');
      expect(conteudo).toHaveClass('desabafo-card__conteudo--clicavel');
      expect(conteudo).toHaveAttribute('role', 'button');
      expect(conteudo).toHaveAttribute('tabindex', '0');
    });

    it('chama onVerDesabafo com o numero ao clicar no conteúdo', () => {
      const desabafo = criarDesabafoMock({ numero: 42 });
      const { container } = renderComRouter(
        <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} onVerDesabafo={mockOnVerDesabafo} />
      );
      const conteudo = container.querySelector('.desabafo-card__conteudo')!;
      fireEvent.click(conteudo);
      expect(mockOnVerDesabafo).toHaveBeenCalledWith(42);
    });

    it('não torna o card clicável quando onVerDesabafo está definido mas numero é undefined', () => {
      const desabafo = criarDesabafoMock(); // numero undefined
      const { container } = renderComRouter(
        <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} onVerDesabafo={mockOnVerDesabafo} />
      );
      const conteudo = container.querySelector('.desabafo-card__conteudo');
      expect(conteudo).not.toHaveClass('desabafo-card__conteudo--clicavel');
      expect(conteudo).not.toHaveAttribute('role');
    });

    it('não torna o card clicável quando onVerDesabafo não é fornecido', () => {
      const desabafo = criarDesabafoMock({ numero: 7 });
      const { container } = renderComRouter(
        <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
      );
      const conteudo = container.querySelector('.desabafo-card__conteudo');
      expect(conteudo).not.toHaveClass('desabafo-card__conteudo--clicavel');
      expect(conteudo).not.toHaveAttribute('role');
    });

    it('mantém comportamento normal quando sem onVerDesabafo (compatibilidade)', () => {
      const desabafo = criarDesabafoMock({ numero: 7 });
      const { container } = renderComRouter(
        <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
      );
      const conteudo = container.querySelector('.desabafo-card__conteudo')!;
      fireEvent.click(conteudo);
      // Não deve chamar nada — sem callback
      expect(mockOnVerDesabafo).not.toHaveBeenCalled();
    });
  });
});
