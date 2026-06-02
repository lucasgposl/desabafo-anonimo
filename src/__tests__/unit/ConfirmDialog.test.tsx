import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    mensagem: 'Tem certeza que deseja remover?',
    onConfirmar: jest.fn(),
    onCancelar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não renderiza nada quando isOpen é false', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o dialog quando isOpen é true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('exibe a mensagem fornecida', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Tem certeza que deseja remover?')).toBeInTheDocument();
  });

  it('exibe botão Confirmar e botão Cancelar', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('chama onConfirmar ao clicar no botão Confirmar', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirmar'));
    expect(defaultProps.onConfirmar).toHaveBeenCalledTimes(1);
  });

  it('chama onCancelar ao clicar no botão Cancelar', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onCancelar).toHaveBeenCalledTimes(1);
  });

  it('chama onCancelar ao clicar no overlay', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const overlay = document.querySelector('.confirm-dialog__overlay');
    fireEvent.click(overlay!);
    expect(defaultProps.onCancelar).toHaveBeenCalledTimes(1);
  });

  it('não chama onCancelar ao clicar dentro do dialog', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('alertdialog'));
    expect(defaultProps.onCancelar).not.toHaveBeenCalled();
  });

  it('chama onCancelar ao pressionar Escape', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onCancelar).toHaveBeenCalledTimes(1);
  });

  it('possui aria-modal="true" para acessibilidade', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('é reutilizável com diferentes mensagens', () => {
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} mensagem="Deseja apagar tudo?" />
    );
    expect(screen.getByText('Deseja apagar tudo?')).toBeInTheDocument();

    rerender(
      <ConfirmDialog {...defaultProps} mensagem="Remover este comentário?" />
    );
    expect(screen.getByText('Remover este comentário?')).toBeInTheDocument();
  });
});
