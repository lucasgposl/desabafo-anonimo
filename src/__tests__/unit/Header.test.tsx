import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../../components/Header';

describe('Header', () => {
  it('renderiza o título "Desabafo Anônimo"', () => {
    render(<Header />);
    expect(screen.getByText('Desabafo Anônimo')).toBeInTheDocument();
  });

  it('renderiza o aviso sobre ajuda profissional', () => {
    render(<Header />);
    expect(
      screen.getByText(/não substitui ajuda profissional/i)
    ).toBeInTheDocument();
  });

  it('não exibe link de moderação quando isAdmin é false', () => {
    render(<Header isAdmin={false} />);
    expect(screen.queryByText('Moderação')).not.toBeInTheDocument();
  });

  it('exibe link de moderação quando isAdmin é true', () => {
    render(
      <MemoryRouter>
        <Header isAdmin={true} />
      </MemoryRouter>
    );
    const link = screen.getByText('Moderação');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/moderacao');
  });

  it('renderiza children no slot de ações', () => {
    render(
      <Header>
        <button>Entrar com Google</button>
      </Header>
    );
    expect(screen.getByText('Entrar com Google')).toBeInTheDocument();
  });

  it('renderiza children e link de moderação juntos quando isAdmin', () => {
    render(
      <MemoryRouter>
        <Header isAdmin={true}>
          <button>Sair</button>
        </Header>
      </MemoryRouter>
    );
    expect(screen.getByText('Sair')).toBeInTheDocument();
    expect(screen.getByText('Moderação')).toBeInTheDocument();
  });
});
