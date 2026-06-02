import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InputBox, EMOJIS } from '../../components/InputBox';

describe('InputBox', () => {
  const mockOnPublicar = jest.fn().mockResolvedValue(undefined);

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

    it('exibe select de sentimento com opções Tristeza, Raiva e Alívio', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const select = screen.getByLabelText('Sentimento');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Tristeza')).toBeInTheDocument();
      expect(screen.getByText('Raiva')).toBeInTheDocument();
      expect(screen.getByText('Alívio')).toBeInTheDocument();
    });

    it('sentimento padrão é Tristeza (triste)', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      const tristezaBtn = sentimentoGroup.querySelector('button[aria-label="Tristeza"]')!;
      expect(tristezaBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('exibe botão "Publicar"', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      expect(screen.getByText('Publicar')).toBeInTheDocument();
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
  });

  describe('Publicação com sucesso', () => {
    it('chama onPublicar com texto e sentimento corretos', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(mockOnPublicar).toHaveBeenCalledWith('Meu desabafo', 'triste');
      });
    });

    it('chama onPublicar com sentimento selecionado', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Estou com raiva' } });
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      const raivaSentimentoBtn = sentimentoGroup.querySelector('button[aria-label="Raiva"]')!;
      fireEvent.click(raivaSentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(mockOnPublicar).toHaveBeenCalledWith('Estou com raiva', 'raiva');
      });
    });

    it('limpa campo de texto após sucesso', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('restaura sentimento padrão após sucesso', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Texto' } });
      const sentimentoGroup = screen.getByRole('radiogroup', { name: 'Sentimento' });
      const raivaSentimentoBtn = sentimentoGroup.querySelector('button[aria-label="Raiva"]')!;
      fireEvent.click(raivaSentimentoBtn);
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        const tristezaBtn = sentimentoGroup.querySelector('button[aria-label="Tristeza"]')!;
        expect(tristezaBtn).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('exibe mensagem de acolhimento por 3 segundos após sucesso', async () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      fireEvent.change(textarea, { target: { value: 'Meu desabafo' } });
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
