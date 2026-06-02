import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { DesabafoCard } from '../../components/DesabafoCard';
import { Desabafo, TipoReacao } from '../../types';
import { REACAO_CONFIG, SENTIMENTO_CONFIG } from '../../config/sentimentos';
import { criarReacoesMock, sentimentoPadrao } from '../helpers/fixtureHelper';

// Mock firebase/comentarios to prevent real Firebase calls when ComentarioSection renders
jest.mock('../../firebase/comentarios', () => ({
  buscarComentarios: jest.fn().mockResolvedValue([]),
  criarComentario: jest.fn().mockResolvedValue('mock-id'),
}));

const reacaoKeys = Object.keys(REACAO_CONFIG) as TipoReacao[];
const REACAO_KEY_0 = reacaoKeys[0];
const REACAO_KEY_1 = reacaoKeys[1];
const REACAO_KEY_2 = reacaoKeys[2];
const REACAO_LABEL_0 = REACAO_CONFIG[REACAO_KEY_0].label;
const REACAO_LABEL_1 = REACAO_CONFIG[REACAO_KEY_1].label;
const REACAO_LABEL_2 = REACAO_CONFIG[REACAO_KEY_2].label;
const TOTAL_REACOES = reacaoKeys.length;

function criarDesabafoMock(overrides: Partial<Desabafo> = {}): Desabafo {
  return {
    id: 'abc123',
    texto: 'Este é um desabafo de teste.',
    sentimento: sentimentoPadrao(),
    criadoEm: new Date('2024-01-15T10:00:00Z'),
    reacoes: criarReacoesMock({ [REACAO_KEY_0]: 5, [REACAO_KEY_1]: 3, [REACAO_KEY_2]: 1 }),
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

  it('aplica borda lateral com cor de categoria "dramas"', () => {
    // Use a sentimento da categoria "dramas"
    const dramaKey = Object.keys(SENTIMENTO_CONFIG).find(
      (k) => SENTIMENTO_CONFIG[k as keyof typeof SENTIMENTO_CONFIG].categoria === 'dramas'
    )!;
    const desabafo = criarDesabafoMock({ sentimento: dramaKey });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-dramas)' });
  });

  it('aplica borda lateral com cor de categoria "good_vibes"', () => {
    const goodVibesKey = Object.keys(SENTIMENTO_CONFIG).find(
      (k) => SENTIMENTO_CONFIG[k as keyof typeof SENTIMENTO_CONFIG].categoria === 'good_vibes'
    )!;
    const desabafo = criarDesabafoMock({ sentimento: goodVibesKey });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-good-vibes)' });
  });

  it('aplica cor neutra para sentimento legado desconhecido', () => {
    const desabafo = criarDesabafoMock({ sentimento: 'triste' });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const card = container.querySelector('.desabafo-card');
    expect(card).toHaveStyle({ borderLeftColor: 'var(--cor-neutro)' });
  });

  it('exibe emoji e label do sentimento via obterInfoSentimento para sentimento válido', () => {
    const chave = sentimentoPadrao();
    const info = SENTIMENTO_CONFIG[chave];
    const desabafo = criarDesabafoMock({ sentimento: chave });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const sentimentoEl = container.querySelector('.desabafo-card__sentimento');
    expect(sentimentoEl).toHaveTextContent(info.emoji);
    expect(sentimentoEl).toHaveTextContent(info.label);
  });

  it('exibe fallback para sentimento legado desconhecido', () => {
    const desabafo = criarDesabafoMock({ sentimento: 'triste' });
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const sentimentoEl = container.querySelector('.desabafo-card__sentimento');
    expect(sentimentoEl).toHaveTextContent('❓');
    expect(sentimentoEl).toHaveTextContent('Sentimento antigo');
  });

  it('renderiza todos os 8 botões de reação da config com contadores', () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    // All 8 reaction labels should be present
    for (const [, entry] of Object.entries(REACAO_CONFIG)) {
      expect(screen.getByText(entry.label)).toBeInTheDocument();
    }
    // Counters for the specific values set in mock
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renderiza exatamente 8 botões de reação (total de chaves no REACAO_CONFIG)', () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const botoes = screen.getAllByRole('button', { pressed: undefined });
    // Filter buttons that have aria-label matching a reaction label
    const reacaoBotoes = botoes.filter((btn) =>
      reacaoKeys.some((key) => btn.getAttribute('aria-label') === REACAO_CONFIG[key].label)
    );
    expect(reacaoBotoes).toHaveLength(TOTAL_REACOES);
  });

  it('renderiza botões de reação na mesma ordem definida no REACAO_CONFIG', () => {
    const desabafo = criarDesabafoMock();
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const botoes = container.querySelectorAll('.desabafo-card__reacao-btn');
    const labelsRenderizados = Array.from(botoes).map(
      (btn) => btn.querySelector('.desabafo-card__reacao-label')?.textContent
    );
    const labelsEsperados = Object.values(REACAO_CONFIG).map((entry) => entry.label);
    expect(labelsRenderizados).toEqual(labelsEsperados);
  });

  it('renderiza emoji correto para cada reação conforme REACAO_CONFIG', () => {
    const desabafo = criarDesabafoMock();
    const { container } = renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const botoes = container.querySelectorAll('.desabafo-card__reacao-btn');
    const emojisRenderizados = Array.from(botoes).map(
      (btn) => btn.querySelector('.desabafo-card__reacao-emoji')?.textContent
    );
    const emojisEsperados = Object.values(REACAO_CONFIG).map((entry) => entry.emoji);
    expect(emojisRenderizados).toEqual(emojisEsperados);
  });

  it('marca reação ativa com aria-pressed="true" e classe ativa', () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} reacaoAtiva={REACAO_KEY_0} />
    );
    const btnAtivo = screen.getByLabelText(REACAO_LABEL_0);
    expect(btnAtivo).toHaveAttribute('aria-pressed', 'true');
    expect(btnAtivo).toHaveClass('desabafo-card__reacao-btn--ativo');

    // Demais botões devem estar com aria-pressed="false"
    const btnInativo = screen.getByLabelText(REACAO_LABEL_1);
    expect(btnInativo).toHaveAttribute('aria-pressed', 'false');
    expect(btnInativo).not.toHaveClass('desabafo-card__reacao-btn--ativo');
  });

  it(`chama onReagir com "${REACAO_KEY_0}" ao clicar no primeiro botão de reação`, () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText(REACAO_LABEL_0));
    expect(mockOnReagir).toHaveBeenCalledWith(REACAO_KEY_0);
  });

  it(`chama onReagir com "${REACAO_KEY_1}" ao clicar no segundo botão de reação`, () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText(REACAO_LABEL_1));
    expect(mockOnReagir).toHaveBeenCalledWith(REACAO_KEY_1);
  });

  it(`chama onReagir com "${REACAO_KEY_2}" ao clicar no terceiro botão de reação`, () => {
    const desabafo = criarDesabafoMock();
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    fireEvent.click(screen.getByLabelText(REACAO_LABEL_2));
    expect(mockOnReagir).toHaveBeenCalledWith(REACAO_KEY_2);
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
    const desabafo = criarDesabafoMock({ reacoes: criarReacoesMock() });
    renderComRouter(
      <DesabafoCard desabafo={desabafo} onReagir={mockOnReagir} usuarioAutenticado={false} />
    );
    const contadores = screen.getAllByText('0');
    expect(contadores).toHaveLength(TOTAL_REACOES);
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
