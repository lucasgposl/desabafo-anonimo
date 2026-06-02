import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InputBox, EMOJIS } from '../../components/InputBox';
import { SENTIMENTO_CONFIG, sentimentosPorCategoria, CATEGORIAS } from '../../config/sentimentos';

describe('InputBox', () => {
  const mockOnPublicar = jest.fn().mockResolvedValue(undefined);

  // Helper: pegar o primeiro sentimento da config
  const primeiroSentimento = Object.keys(SENTIMENTO_CONFIG)[0];
  const primeiroSentimentoEntry = SENTIMENTO_CONFIG[primeiroSentimento as keyof typeof SENTIMENTO_CONFIG];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Renderização inicial', () => {
    it('exibe textarea com placeholder acolhedor', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder');
      expect(textarea.getAttribute('placeholder')).not.toBe('');
    });

    it('exibe radiogroup de sentimentos com categorias Dramas e Good Vibes', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      expect(sentimentoGroup).toBeInTheDocument();
      expect(screen.getByText('Dramas')).toBeInTheDocument();
      expect(screen.getByText('Good Vibes')).toBeInTheDocument();
    });

    it('nenhum sentimento está pré-selecionado', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      const buttons = sentimentoGroup.querySelectorAll('button[aria-pressed="true"]');
      expect(buttons).toHaveLength(0);
    });

    it('exibe botão "Publicar"', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      expect(screen.getByText('Publicar')).toBeInTheDocument();
    });
  });

  describe('Sentimentos agrupados por categoria (Req 6.1, 6.2)', () => {
    it('renderiza todos os 15 sentimentos do SENTIMENTO_CONFIG', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      const allKeys = Object.keys(SENTIMENTO_CONFIG);
      allKeys.forEach((chave) => {
        const entry = SENTIMENTO_CONFIG[chave as keyof typeof SENTIMENTO_CONFIG];
        expect(within(sentimentoGroup).getByLabelText(entry.label)).toBeInTheDocument();
      });
    });

    it('exibe emoji e label de cada sentimento conforme o config', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      const allKeys = Object.keys(SENTIMENTO_CONFIG);
      allKeys.forEach((chave) => {
        const entry = SENTIMENTO_CONFIG[chave as keyof typeof SENTIMENTO_CONFIG];
        const btn = within(sentimentoGroup).getByLabelText(entry.label);
        expect(btn).toHaveTextContent(entry.emoji);
        expect(btn).toHaveTextContent(entry.label);
      });
    });

    it('agrupa sentimentos em duas seções: Dramas (9) e Good Vibes (6)', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const grupos = sentimentosPorCategoria();
      expect(grupos.dramas).toHaveLength(9);
      expect(grupos.good_vibes).toHaveLength(6);
      // Verify category labels are present
      expect(screen.getByText(CATEGORIAS.dramas)).toBeInTheDocument();
      expect(screen.getByText(CATEGORIAS.good_vibes)).toBeInTheDocument();
    });

    it('seleção exclusiva: apenas um sentimento ativo por vez', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      const keys = Object.keys(SENTIMENTO_CONFIG);

      // Click first
      const firstEntry = SENTIMENTO_CONFIG[keys[0] as keyof typeof SENTIMENTO_CONFIG];
      fireEvent.click(within(sentimentoGroup).getByLabelText(firstEntry.label));
      expect(within(sentimentoGroup).getByLabelText(firstEntry.label)).toHaveAttribute('aria-pressed', 'true');

      // Click second — first should deselect
      const secondEntry = SENTIMENTO_CONFIG[keys[1] as keyof typeof SENTIMENTO_CONFIG];
      fireEvent.click(within(sentimentoGroup).getByLabelText(secondEntry.label));
      expect(within(sentimentoGroup).getByLabelText(firstEntry.label)).toHaveAttribute('aria-pressed', 'false');
      expect(within(sentimentoGroup).getByLabelText(secondEntry.label)).toHaveAttribute('aria-pressed', 'true');

      // Only one active at a time
      const activeButtons = sentimentoGroup.querySelectorAll('button[aria-pressed="true"]');
      expect(activeButtons).toHaveLength(1);
    });
  });

  describe('Validação', () => {
    it('exibe erro quando texto está vazio', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      fireEvent.click(screen.getByText('Publicar'));
      expect(screen.getByText('Escreva algo antes de publicar!')).toBeInTheDocument();
      expect(mockOnPublicar).not.toHaveBeenCalled();
    });

    it('exibe erro quando texto contém apenas espaços', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.click(screen.getByText('Publicar'));
      expect(screen.getByText('Escreva algo antes de publicar!')).toBeInTheDocument();
      expect(mockOnPublicar).not.toHaveBeenCalled();
    });

    it('exibe erro quando texto excede 2000 caracteres', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      const textoLongo = 'a'.repeat(2001);
      fireEvent.change(textarea, { target: { value: textoLongo } });
      fireEvent.click(screen.getByText('Publicar'));
      expect(screen.getByText('O texto deve ter no máximo 2000 caracteres.')).toBeInTheDocument();
      expect(mockOnPublicar).not.toHaveBeenCalled();
    });

    it('exibe erro quando nenhum sentimento está selecionado', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });
      fireEvent.click(screen.getByText('Publicar'));
      expect(screen.getByText('Selecione um sentimento antes de publicar!')).toBeInTheDocument();
      expect(mockOnPublicar).not.toHaveBeenCalled();
    });
  });

  describe('Publicação com sucesso', () => {
    it('chama onPublicar com texto e sentimento corretos', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });

      // Selecionar o primeiro sentimento
      const sentimentoBtn = screen.getByLabelText(primeiroSentimentoEntry.label);
      fireEvent.click(sentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(mockOnPublicar).toHaveBeenCalledWith('Meu desabafo', primeiroSentimento);
      });
    });

    it('chama onPublicar com sentimento selecionado', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Estou sentindo algo' } });

      // Selecionar o segundo sentimento da config
      const sentimentos = Object.keys(SENTIMENTO_CONFIG);
      const segundoSentimento = sentimentos[1];
      const segundoEntry = SENTIMENTO_CONFIG[segundoSentimento as keyof typeof SENTIMENTO_CONFIG];
      const sentimentoBtn = screen.getByLabelText(segundoEntry.label);
      fireEvent.click(sentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(mockOnPublicar).toHaveBeenCalledWith('Estou sentindo algo', segundoSentimento);
      });
    });

    it('limpa campo de texto após sucesso', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });

      // Selecionar um sentimento para poder publicar
      const sentimentoBtn = screen.getByLabelText(primeiroSentimentoEntry.label);
      fireEvent.click(sentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('reseta sentimento para null após sucesso', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Texto' } });

      const sentimentoBtn = screen.getByLabelText(primeiroSentimentoEntry.label);
      fireEvent.click(sentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
        const activeButtons = sentimentoGroup.querySelectorAll('button[aria-pressed="true"]');
        expect(activeButtons).toHaveLength(0);
      });
    });

    it('exibe mensagem de acolhimento por 3 segundos após sucesso', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });

      // Selecionar sentimento para poder publicar
      const sentimentoBtn = screen.getByLabelText(primeiroSentimentoEntry.label);
      fireEvent.click(sentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Erro na publicação', () => {
    it('exibe mensagem de erro quando onPublicar falha', async () => {
      const mockOnPublicarErro = jest.fn().mockRejectedValue(new Error('Falha'));
      render(<InputBox onPublicar={mockOnPublicarErro} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });

      // Selecionar sentimento para passar a validação
      const sentimentoBtn = screen.getByLabelText(primeiroSentimentoEntry.label);
      fireEvent.click(sentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Erro ao publicar. Tente novamente.')).toBeInTheDocument();
      });
    });

    it('mantém texto no campo quando onPublicar falha', async () => {
      const mockOnPublicarErro = jest.fn().mockRejectedValue(new Error('Falha'));
      render(<InputBox onPublicar={mockOnPublicarErro} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });

      // Selecionar sentimento para passar a validação
      const sentimentoBtn = screen.getByLabelText(primeiroSentimentoEntry.label);
      fireEvent.click(sentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(textarea.value).toBe('Meu desabafo');
      });
    });
  });

  describe('Estado de loading', () => {
    it('exibe "Publicando..." quando isPublicando é true', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={true} />);
      expect(screen.getByText('Publicando...')).toBeInTheDocument();
    });

    it('botão está desabilitado quando isPublicando é true', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={true} />);
      const button = screen.getByText('Publicando...').closest('button')!;
      expect(button).toBeDisabled();
    });

    it('textarea está desabilitado quando isPublicando é true', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={true} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      expect(textarea).toBeDisabled();
    });

    it('botões de sentimento estão desabilitados quando isPublicando é true', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={true} />);
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      const buttons = sentimentoGroup.querySelectorAll('button');
      buttons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('Emoji Picker Bar', () => {
    it('renderiza a barra com role="toolbar" e aria-label="Emojis"', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });
      expect(toolbar).toBeInTheDocument();
    });

    it('renderiza no mínimo 25 botões de emoji', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });
      const buttons = within(toolbar).getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(25);
    });

    it('a barra fica entre o textarea e os controles no DOM', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });
      const textarea = screen.getByLabelText('Texto do desabafo');

      // previousElementSibling of toolbar should be the textarea
      expect(toolbar.previousElementSibling).toBe(textarea);
      // nextElementSibling of toolbar should be the controls div
      expect(toolbar.nextElementSibling).toHaveClass('input-box__controles');
    });

    it('todos os botões ficam desabilitados quando isPublicando=true', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={true} />);
      const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });
      const buttons = within(toolbar).getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });

    it('clicar em um emoji insere no valor do textarea', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo') as HTMLTextAreaElement;
      const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });
      const firstEmojiButton = within(toolbar).getAllByRole('button')[0];

      fireEvent.click(firstEmojiButton);

      expect(textarea.value).toContain(EMOJIS[0].char);
    });
  });
});
