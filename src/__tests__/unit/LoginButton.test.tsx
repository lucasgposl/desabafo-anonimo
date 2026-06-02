import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginButton } from '../../components/LoginButton';

describe('LoginButton', () => {
  const mockOnLogin = jest.fn().mockResolvedValue(undefined);
  const mockOnLogout = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Estado visitante (não autenticado)', () => {
    it('exibe botão "Entrar com Google" quando usuario é null', () => {
      render(
        <LoginButton
          usuario={null}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={false}
        />
      );
      expect(screen.getByText('Entrar com Google')).toBeInTheDocument();
    });

    it('chama onLogin ao clicar no botão "Entrar com Google"', () => {
      render(
        <LoginButton
          usuario={null}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={false}
        />
      );
      fireEvent.click(screen.getByText('Entrar com Google'));
      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });

    it('não exibe botão "Sair" quando usuario é null', () => {
      render(
        <LoginButton
          usuario={null}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={false}
        />
      );
      expect(screen.queryByText('Sair')).not.toBeInTheDocument();
    });
  });

  describe('Estado autenticado', () => {
    const usuario = { uid: 'user-123' };

    it('exibe botão "Sair" quando usuario está autenticado', () => {
      render(
        <LoginButton
          usuario={usuario}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={false}
        />
      );
      expect(screen.getByText('Sair')).toBeInTheDocument();
    });

    it('chama onLogout ao clicar no botão "Sair"', () => {
      render(
        <LoginButton
          usuario={usuario}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={false}
        />
      );
      fireEvent.click(screen.getByText('Sair'));
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('não exibe botão "Entrar com Google" quando autenticado', () => {
      render(
        <LoginButton
          usuario={usuario}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={false}
        />
      );
      expect(screen.queryByText('Entrar com Google')).not.toBeInTheDocument();
    });
  });

  describe('Estado loading', () => {
    it('exibe indicador de carregamento quando isLoading é true', () => {
      render(
        <LoginButton
          usuario={null}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={true}
        />
      );
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('botão está desabilitado durante loading', () => {
      render(
        <LoginButton
          usuario={null}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={true}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('botão tem aria-busy durante loading', () => {
      render(
        <LoginButton
          usuario={null}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={true}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('não exibe "Entrar com Google" nem "Sair" durante loading', () => {
      render(
        <LoginButton
          usuario={null}
          onLogin={mockOnLogin}
          onLogout={mockOnLogout}
          isLoading={true}
        />
      );
      expect(screen.queryByText('Entrar com Google')).not.toBeInTheDocument();
      expect(screen.queryByText('Sair')).not.toBeInTheDocument();
    });
  });
});
