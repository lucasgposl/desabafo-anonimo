import { LoginButtonProps } from '../types';
import './LoginButton.css';

export function LoginButton({ usuario, onLogin, onLogout, isLoading }: LoginButtonProps) {
  if (isLoading) {
    return (
      <button className="login-button login-button--loading" disabled aria-busy="true">
        <span className="login-button__loading-indicator" aria-hidden="true" />
        Carregando...
      </button>
    );
  }

  if (usuario) {
    return (
      <button className="login-button login-button--sair" onClick={onLogout}>
        Sair
      </button>
    );
  }

  return (
    <button className="login-button login-button--entrar" onClick={onLogin}>
      Entrar com Google
    </button>
  );
}
