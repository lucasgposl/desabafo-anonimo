import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedControls } from '../../components/FeedControls';
import { SENTIMENTO_CONFIG, sentimentosPorCategoria, CATEGORIAS } from '../../config/sentimentos';
import { sentimentoPadrao } from '../helpers/fixtureHelper';

describe('FeedControls', () => {
  const defaultProps = {
    filtroAtivo: 'todos' as const,
    onFiltroChange: jest.fn(),
    totalDesabafos: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o select de filtro com opção Todos e todos os 15 sentimentos', () => {
    render(<FeedControls {...defaultProps} />);
    const select = screen.getByLabelText('Filtrar por sentimento');
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll('option');
    // 1 (Todos) + 15 sentimentos do config
    expect(options).toHaveLength(1 + Object.keys(SENTIMENTO_CONFIG).length);
    expect(options[0]).toHaveTextContent('Todos');
  });

  it('exibe "Todos" selecionado por padrão', () => {
    render(<FeedControls {...defaultProps} filtroAtivo="todos" />);
    const select = screen.getByLabelText('Filtrar por sentimento') as HTMLSelectElement;
    expect(select.value).toBe('todos');
  });

  it('renderiza optgroups "Dramas" e "Good Vibes"', () => {
    render(<FeedControls {...defaultProps} />);
    const select = screen.getByLabelText('Filtrar por sentimento');
    const optgroups = select.querySelectorAll('optgroup');

    expect(optgroups).toHaveLength(2);
    expect(optgroups[0]).toHaveAttribute('label', CATEGORIAS.dramas);
    expect(optgroups[1]).toHaveAttribute('label', CATEGORIAS.good_vibes);
  });

  it('cada sentimento exibe emoji + label conforme SENTIMENTO_CONFIG', () => {
    render(<FeedControls {...defaultProps} />);
    const select = screen.getByLabelText('Filtrar por sentimento');
    const options = select.querySelectorAll('option');

    // Pula a primeira opção (Todos)
    const sentimentoOptions = Array.from(options).slice(1);

    const categorias = sentimentosPorCategoria();
    const todasChaves = [...categorias.dramas, ...categorias.good_vibes];

    expect(sentimentoOptions).toHaveLength(todasChaves.length);

    sentimentoOptions.forEach((option, index) => {
      const chave = todasChaves[index];
      const entry = SENTIMENTO_CONFIG[chave];
      expect(option).toHaveTextContent(`${entry.emoji} ${entry.label}`);
      expect(option).toHaveAttribute('value', chave);
    });
  });

  it('optgroup "Dramas" contém 9 sentimentos na ordem do config', () => {
    render(<FeedControls {...defaultProps} />);
    const select = screen.getByLabelText('Filtrar por sentimento');
    const optgroups = select.querySelectorAll('optgroup');
    const dramasGroup = optgroups[0];
    const dramasOptions = dramasGroup.querySelectorAll('option');

    const categorias = sentimentosPorCategoria();
    expect(dramasOptions).toHaveLength(categorias.dramas.length);

    categorias.dramas.forEach((chave, index) => {
      const entry = SENTIMENTO_CONFIG[chave];
      expect(dramasOptions[index]).toHaveTextContent(`${entry.emoji} ${entry.label}`);
    });
  });

  it('optgroup "Good Vibes" contém 6 sentimentos na ordem do config', () => {
    render(<FeedControls {...defaultProps} />);
    const select = screen.getByLabelText('Filtrar por sentimento');
    const optgroups = select.querySelectorAll('optgroup');
    const goodVibesGroup = optgroups[1];
    const goodVibesOptions = goodVibesGroup.querySelectorAll('option');

    const categorias = sentimentosPorCategoria();
    expect(goodVibesOptions).toHaveLength(categorias.good_vibes.length);

    categorias.good_vibes.forEach((chave, index) => {
      const entry = SENTIMENTO_CONFIG[chave];
      expect(goodVibesOptions[index]).toHaveTextContent(`${entry.emoji} ${entry.label}`);
    });
  });

  it('exibe o filtro ativo corretamente', () => {
    const primSentimento = sentimentoPadrao();
    render(<FeedControls {...defaultProps} filtroAtivo={primSentimento} />);
    const select = screen.getByLabelText('Filtrar por sentimento') as HTMLSelectElement;
    expect(select.value).toBe(primSentimento);
  });

  it('chama onFiltroChange ao selecionar um sentimento', () => {
    const onFiltroChange = jest.fn();
    render(<FeedControls {...defaultProps} onFiltroChange={onFiltroChange} />);
    const select = screen.getByLabelText('Filtrar por sentimento');
    const primSentimento = sentimentoPadrao();

    fireEvent.change(select, { target: { value: primSentimento } });
    expect(onFiltroChange).toHaveBeenCalledWith(primSentimento);
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
    const primSentimento = sentimentoPadrao();
    render(<FeedControls {...defaultProps} filtroAtivo={primSentimento} onFiltroChange={onFiltroChange} />);
    const select = screen.getByLabelText('Filtrar por sentimento');

    fireEvent.change(select, { target: { value: 'todos' } });
    expect(onFiltroChange).toHaveBeenCalledWith('todos');
  });
});
