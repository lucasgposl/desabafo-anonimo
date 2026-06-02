import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Feed } from '../../components/Feed';
import { Desabafo } from '../../types';

function criarDesabafoMock(overrides: Partial<Desabafo> & { id: string }): Desabafo {
  return {
    texto: 'Texto de teste',
    sentimento: 'triste',
    criadoEm: new Date('2024-01-15T10:00:00Z'),
    reacoes: { apoio: 0, forca: 0, pouco: 0 },
    totalComentarios: 0,
    ...overrides,
  };
}

describe('Feed', () => {
  const mockOnLoadMore = jest.fn();
  const mockOnReagir = jest.fn();

  beforeEach(() => {
    mockOnLoadMore.mockClear();
    mockOnReagir.mockClear();
  });

  it('exibe LoadingIndicator quando isLoading é true e não há desabafos', () => {
    render(
      <Feed
        desabafos={[]}
        isLoading={true}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );
    expect(screen.getByLabelText('Carregando desabafos')).toBeInTheDocument();
    expect(screen.getByText('Carregando desabafos...')).toBeInTheDocument();
  });

  it('exibe EmptyState quando não há desabafos e não está carregando', () => {
    render(
      <Feed
        desabafos={[]}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );
    expect(screen.getByLabelText('Nenhum desabafo encontrado')).toBeInTheDocument();
    expect(screen.getByText('Nenhum desabafo por aqui ainda. Seja o primeiro a compartilhar.')).toBeInTheDocument();
  });

  it('renderiza lista de DesabafoCards quando há desabafos', () => {
    const desabafos = [
      criarDesabafoMock({ id: '1', texto: 'Primeiro desabafo' }),
      criarDesabafoMock({ id: '2', texto: 'Segundo desabafo' }),
      criarDesabafoMock({ id: '3', texto: 'Terceiro desabafo' }),
    ];

    render(
      <Feed
        desabafos={desabafos}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );

    expect(screen.getByText('Primeiro desabafo')).toBeInTheDocument();
    expect(screen.getByText('Segundo desabafo')).toBeInTheDocument();
    expect(screen.getByText('Terceiro desabafo')).toBeInTheDocument();
  });

  it('exibe botão "Carregar mais" quando hasMore é true', () => {
    const desabafos = [criarDesabafoMock({ id: '1' })];

    render(
      <Feed
        desabafos={desabafos}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );

    expect(screen.getByText('Carregar mais')).toBeInTheDocument();
  });

  it('não exibe botão "Carregar mais" quando hasMore é false', () => {
    const desabafos = [criarDesabafoMock({ id: '1' })];

    render(
      <Feed
        desabafos={desabafos}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );

    expect(screen.queryByText('Carregar mais')).not.toBeInTheDocument();
  });

  it('chama onLoadMore ao clicar no botão "Carregar mais"', () => {
    const desabafos = [criarDesabafoMock({ id: '1' })];

    render(
      <Feed
        desabafos={desabafos}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );

    fireEvent.click(screen.getByText('Carregar mais'));
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
  });

  it('não exibe botão "Carregar mais" durante carregamento', () => {
    const desabafos = [criarDesabafoMock({ id: '1' })];

    render(
      <Feed
        desabafos={desabafos}
        isLoading={true}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );

    expect(screen.queryByText('Carregar mais')).not.toBeInTheDocument();
  });

  it('exibe loading inline quando está carregando mais e já tem desabafos', () => {
    const desabafos = [criarDesabafoMock({ id: '1' })];

    render(
      <Feed
        desabafos={desabafos}
        isLoading={true}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );

    expect(screen.getByLabelText('Carregando mais desabafos')).toBeInTheDocument();
  });

  it('não exibe informações identificáveis do autor nos cards', () => {
    const desabafos = [criarDesabafoMock({ id: '1', texto: 'Desabafo anônimo' })];

    const { container } = render(
      <Feed
        desabafos={desabafos}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
        onReagir={mockOnReagir}
        usuarioAutenticado={false}
      />
    );

    // Verifica que não há elementos com informações de autor
    const html = container.innerHTML;
    expect(html).not.toContain('uid');
    expect(html).not.toContain('email');
    expect(html).not.toContain('nome');
    expect(html).not.toContain('foto');
  });
});
