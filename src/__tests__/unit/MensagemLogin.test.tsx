import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MensagemLogin } from '../../components/MensagemLogin';

describe('MensagemLogin', () => {
  it('renderiza a mensagem convidando o visitante a fazer login', () => {
    render(<MensagemLogin />);
    expect(
      screen.getByText('Faça login para publicar seu desabafo.')
    ).toBeInTheDocument();
  });

  it('possui role="status" para acessibilidade', () => {
    render(<MensagemLogin />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('aplica a classe CSS correta no container', () => {
    const { container } = render(<MensagemLogin />);
    expect(container.querySelector('.mensagem-login')).toBeInTheDocument();
  });
});
