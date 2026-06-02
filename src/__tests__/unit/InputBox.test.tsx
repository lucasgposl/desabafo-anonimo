import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InputBox } from '../../components/InputBox';

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
      const select = screen.getByLabelText('Sentimento') as HTMLSelectElement;
      expect(select.value).toBe('triste');
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
      const select = screen.getByLabelText('Sentimento');
      fireEvent.change(textarea, { target: { value: 'Estou com raiva' } });
      fireEvent.change(select, { target: { value: 'raiva' } });
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
      const select = screen.getByLabelText('Sentimento') as HTMLSelectElement;
      fireEvent.change(textarea, { target: { value: 'Texto' } });
      fireEvent.change(select, { target: { value: 'raiva' } });
      fireEvent.click(screen.getByText('Publicar'));

      await waitFor(() => {
        expect(select.value).toBe('triste');
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
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('textarea está desabilitado quando isPublicando é true', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={true} />);
      const textarea = screen.getByLabelText('Texto do desabafo');
      expect(textarea).toBeDisabled();
    });

    it('select está desabilitado quando isPublicando é true', () => {
      render(<InputBox onPublicar={mockOnPublicar} isPublicando={true} />);
      const select = screen.getByLabelText('Sentimento');
      expect(select).toBeDisabled();
    });
  });
});
