import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedControls } from '../../components/FeedControls';

describe('FeedControls', () => {
  const defaultProps = {
    filtroAtivo: 'todos' as const,
    onFiltroChange: jest.fn(),
    totalDesabafos: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o select de filtro com as opções corretas', () => {
    render(<FeedControls {...defaultProps} />);
    const select = screen.getByLabelText('Filtrar por sentimento');
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Todos');
    expect(options[1]).toHaveTextContent('Tristeza');
    expect(options[2]).toHaveTextContent('Raiva');
    expect(options[3]).toHaveTextContent('Alívio');
  });

  it('exibe "Todos" selecionado por padrão', () => {
    render(<FeedControls {...defaultProps} filtroAtivo="todos" />);
    const select = screen.getByLabelText('Filtrar por sentimento') as HTMLSelectElement;
    expect(select.value).toBe('todos');
  });

  it('exibe o filtro ativo corretamente', () => {
    render(<FeedControls {...defaultProps} filtroAtivo="raiva" />);
    const select = screen.getByLabelText('Filtrar por sentimento') as HTMLSelectElement;
    expect(select.value).toBe('raiva');
  });

  it('chama onFiltroChange ao selecionar um sentimento', () => {
    const onFiltroChange = jest.fn();
    render(<FeedControls {...defaultProps} onFiltroChange={onFiltroChange} />);
    const select = screen.getByLabelText('Filtrar por sentimento');

    fireEvent.change(select, { target: { value: 'triste' } });
    expect(onFiltroChange).toHaveBeenCalledWith('triste');
  });

  it('exibe contador no formato plural para 0 desabafos', () => {
    render(<FeedControls {...defaultProps} totalDesabafos={0} />);
    expect(screen.getByText('0 desabafos')).toBeInTheDocument();
  });

  it('exibe contador no formato singular para 1 desabafo', () => {
    render(<FeedControls {...defaultProps} totalDesabafos={1} />);
    expect(screen.getByText('1 desabafo')).toBeInTheDocument();
  });

  it('exibe contador no formato plural para mais de 1 desabafo', () => {
    render(<FeedControls {...defaultProps} totalDesabafos={42} />);
    expect(screen.getByText('42 desabafos')).toBeInTheDocument();
  });

  it('chama onFiltroChange com "todos" ao selecionar Todos', () => {
    const onFiltroChange = jest.fn();
    render(<FeedControls {...defaultProps} filtroAtivo="triste" onFiltroChange={onFiltroChange} />);
    const select = screen.getByLabelText('Filtrar por sentimento');

    fireEvent.change(select, { target: { value: 'todos' } });
    expect(onFiltroChange).toHaveBeenCalledWith('todos');
  });
});
