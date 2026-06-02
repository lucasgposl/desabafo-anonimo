import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';

import { Header } from '../components/Header';
import { LoginButton } from '../components/LoginButton';
import { Footer } from '../components/Footer';

import './PaginaSobre.css';

/**
 * Página Sobre (rota /sobre).
 * Exibe informações sobre o projeto Desabafo Anônimo,
 * sua finalidade e um aviso sobre ajuda profissional.
 */
export function PaginaSobre() {
  const { usuario, isLoading: isAuthLoading, login, logout } = useAuth();
  const { isAdmin } = useAdmin(usuario?.uid ?? null);

  return (
    <div className="app">
      <Header isAdmin={isAdmin}>
        <LoginButton
          usuario={usuario}
          onLogin={login}
          onLogout={logout}
          isLoading={isAuthLoading}
        />
      </Header>

      <main className="app__conteudo pagina-sobre">
        <h2 className="pagina-sobre__titulo">Sobre o Desabafo Anônimo</h2>

        <section className="pagina-sobre__secao">
          <p className="pagina-sobre__texto">
            O Desabafo Anônimo é um espaço seguro e anônimo criado para que estudantes possam
            expressar seus sentimentos, desabafar sobre suas dificuldades e buscar apoio sem
            medo de julgamento.
          </p>
          <p className="pagina-sobre__texto">
            Acreditamos que compartilhar o que sentimos é um passo importante para o bem-estar
            emocional. Aqui, você pode escrever livremente sobre o que está passando, ler
            desabafos de outras pessoas e demonstrar empatia através de reações e comentários.
          </p>
        </section>

        <section className="pagina-sobre__secao pagina-sobre__secao--aviso">
          <h3 className="pagina-sobre__subtitulo">Aviso importante</h3>
          <p className="pagina-sobre__texto">
            Este projeto não substitui ajuda profissional. Se você está passando por um momento
            difícil, procure um psicólogo ou ligue para o CVV (Centro de Valorização da Vida)
            no número <strong>188</strong>. A ligação é gratuita e funciona 24 horas.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
