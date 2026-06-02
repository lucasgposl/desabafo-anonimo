import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComentarioSection } from '../../components/ComentarioSection';

jest.mock('../../firebase/comentarios', () => ({
  buscarComentarios: jest.fn().mockResolvedValue([]),
  criarComentario: jest.fn().mockResolvedValue('mock-id'),
}));

describe('ComentarioSection - Emoji Picker Bar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza emoji-bar com role="toolbar" quando usuário autenticado', async () => {
    render(
      <ComentarioSection desabafoId="test-id" usuarioAutenticado={true} uid="user-1" />
    );

    await waitFor(() => {
      expect(screen.queryByText('Carregando comentários...')).not.toBeInTheDocument();
    });

    const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });
    expect(toolbar).toBeInTheDocument();
  });

  it('clicar emoji insere no textarea de comentário', async () => {
    render(
      <ComentarioSection desabafoId="test-id" usuarioAutenticado={true} uid="user-1" />
    );

    await waitFor(() => {
      expect(screen.queryByText('Carregando comentários...')).not.toBeInTheDocument();
    });

    const textarea = screen.getByLabelText('Texto do comentário') as HTMLTextAreaElement;
    const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });
    const firstBtn = within(toolbar).getAllByRole('button')[0];

    fireEvent.click(firstBtn);

    expect(textarea.value).toContain(firstBtn.textContent!);
  });

  it('botões de emoji NÃO estão desabilitados no estado normal (isPublicando=false)', async () => {
    render(
      <ComentarioSection desabafoId="test-id" usuarioAutenticado={true} uid="user-1" />
    );

    await waitFor(() => {
      expect(screen.queryByText('Carregando comentários...')).not.toBeInTheDocument();
    });

    const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });
    const buttons = within(toolbar).getAllByRole('button');
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it('emoji-bar NÃO renderizada quando usuário não autenticado', async () => {
    render(
      <ComentarioSection desabafoId="test-id" usuarioAutenticado={false} />
    );

    await waitFor(() => {
      expect(screen.queryByText('Carregando comentários...')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('toolbar', { name: 'Emojis' })).not.toBeInTheDocument();
  });
});
