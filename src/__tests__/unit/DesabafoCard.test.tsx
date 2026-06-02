import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DesabafoCard } from '../../components/DesabafoCard';
import { Desabafo } from '../../types';

function criarDesabafoMock(overrides: Partial<Desabafo> = {}): Desabafo {
  return {
    id: 'abc123',
    texto: 'Este é um desabafo de teste.',
    sentimento: 'triste',
    criadoEm: new Date('2024-01-15T10:00:00Z'),
    reacoes: { apoio: 5, forca: 3, pouco: 1 },
    totalComentarios: 2,
    ...overrides,
  };
}

describe('DesabafoCard', () => {
  const mockOnReagir = jest.fn();

  beforeEach(() => {
    mockOnReagir.mockClear();
  });

  it('renderiza o texto do desabafo', () => {
    const desabafo = criarDesabafoMock();
    render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.getByText('Este é um desabafo de teste.')).toBeInTheDocument();
  });

  it('renderiza o tempo relativo da publicação', () => {
    const agora = new Date();
    const desabafo = criarDesabafoMock({ criadoEm: new Date(agora.getTime() - 30000) });
    render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.getByText('agora')).toBeInTheDocument();
  });

  it('aplica borda lateral azul para sentimento triste', () => {
    const desabafo = criarDesabafoMock({ sentimento: 'triste' });
    const { container } = render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-tristeza)' });
  });

  it('aplica borda lateral vermelha para sentimento raiva', () => {
    const desabafo = criarDesabafoMock({ sentimento: 'raiva' });
    const { container } = render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-raiva)' });
  });

  it('aplica borda lateral verde para sentimento alivio', () => {
    const desabafo = criarDesabafoMock({ sentimento: 'alivio' });
    const { container } = render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-alivio)' });
  });

  it('renderiza três botões de reação com contadores', () => {
    const desabafo = criarDesabafoMock();
    render(
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
    render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText('Eu me identifiquei'));
    expect(mockOnReagir).toHaveBeenCalledWith('apoio');
  });

  it('chama onReagir com "forca" ao clicar em "Força"', () => {
    const desabafo = criarDesabafoMock();
    render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText('Força'));
    expect(mockOnReagir).toHaveBeenCalledWith('forca');
  });

  it('chama onReagir com "pouco" ao clicar em "Eu acho é pouco"', () => {
    const desabafo = criarDesabafoMock();
    render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText('Eu acho é pouco'));
    expect(mockOnReagir).toHaveBeenCalledWith('pouco');
  });

  it('renderiza botão de comentários com contador', () => {
    const desabafo = criarDesabafoMock({ totalComentarios: 7 });
    render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(screen.getByText('Comentários (7)')).toBeInTheDocument();
  });

  it('expande seção de comentários ao clicar no botão', () => {
    const desabafo = criarDesabafoMock();
    const { container } = render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    expect(container.querySelector('.desabafo-card__comentarios-section')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Comentários (2)'));
    expect(container.querySelector('.desabafo-card__comentarios-section')).toBeInTheDocument();
  });

  it('colapsa seção de comentários ao clicar novamente', () => {
    const desabafo = criarDesabafoMock();
    const { container } = render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );

    fireEvent.click(screen.getByText('Comentários (2)'));
    expect(container.querySelector('.desabafo-card__comentarios-section')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Comentários (2)'));
    expect(container.querySelector('.desabafo-card__comentarios-section')).not.toBeInTheDocument();
  });

  it('exibe contadores de reação zerados para desabafo sem reações', () => {
    const desabafo = criarDesabafoMock({ reacoes: { apoio: 0, forca: 0, pouco: 0 } });
    render(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const contadores = screen.getAllByText('0');
    expect(contadores).toHaveLength(3);
  });
});
