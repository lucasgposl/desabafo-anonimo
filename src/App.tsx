import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from './hooks/useAuth';
import { useAdmin } from './hooks/useAdmin';
import { useDesabafos } from './hooks/useDesabafos';
import { usePublicar } from './hooks/usePublicar';
import { useReacoes } from './hooks/useReacoes';

import './App.css';

import { Header } from './components/Header';
import { LoginButton } from './components/LoginButton';
import { InputBox } from './components/InputBox';
import { MensagemLogin } from './components/MensagemLogin';
import { FeedControls } from './components/FeedControls';
import { Feed } from './components/Feed';
import { PaginaModeracao } from './components/PaginaModeracao';
import { RotaProtegidaAdmin } from './components/RotaProtegidaAdmin';
import { PaginaFeed as PaginaFeedPage } from './pages/PaginaFeed';
import { PaginaDesabafo } from './pages/PaginaDesabafo';
import { PaginaTrends } from './pages/PaginaTrends';

import type { Sentimento, Desabafo } from './types';

/**
 * Página principal do feed.
 * Conecta todos os hooks e componentes para exibir o feed de desabafos.
 */
function PaginaFeed() {
  const { usuario, isLoading: isAuthLoading, isAutenticado, login, logout } = useAuth();
  const { isAdmin } = useAdmin(usuario?.uid ?? null);
  const navigate = useNavigate();

  const [filtro, setFiltro] = useState<Sentimento | 'todos'>('todos');

  const {
    desabafos: desabafosHook,
    isLoading: isFeedLoading,
    error: feedError,
    hasMore,
    loadMore,
    total,
    inserirNoTopo,
  } = useDesabafos(filtro);

  // Estado local dos desabafos para permitir optimistic updates nas reações
  const [desabafosLocal, setDesabafosLocal] = useState<Desabafo[]>([]);

  // Sincronizar estado local com o hook quando os dados mudam
  useEffect(() => {
    setDesabafosLocal(desabafosHook);
  }, [desabafosHook]);

  const { reagir, reacaoUsuario } = useReacoes(desabafosLocal, setDesabafosLocal);

  const { publicar, isPublicando } = usePublicar(usuario?.uid ?? '');

  // Exibir mensagem de redirecionamento (vinda de RotaProtegidaAdmin)
  const location = useLocation();
  const [mensagemRedirecionamento, setMensagemRedirecionamento] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { mensagem?: string } | null;
    if (state?.mensagem) {
      setMensagemRedirecionamento(state.mensagem);
      // Limpar mensagem após 3 segundos
      const timer = setTimeout(() => setMensagemRedirecionamento(null), 3000);
      // Limpar state da location para não exibir novamente ao navegar
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  /**
   * Handler de publicação: chama usePublicar e insere no topo do feed local.
   */
  const handlePublicar = useCallback(
    async (texto: string, sentimento: Sentimento) => {
      const novoDesabafo = await publicar(texto, sentimento);
      if (novoDesabafo) {
        // Inserir no topo apenas se o filtro é "todos" ou corresponde ao sentimento
        if (filtro === 'todos' || filtro === novoDesabafo.sentimento) {
          inserirNoTopo(novoDesabafo);
        }
      }
    },
    [publicar, inserirNoTopo, filtro]
  );

  /**
   * Handler de mudança de filtro.
   */
  const handleFiltroChange = useCallback((novoFiltro: Sentimento | 'todos') => {
    setFiltro(novoFiltro);
  }, []);

  /**
   * Handler de navegação para a página do desabafo.
   */
  const handleVerDesabafo = useCallback((numero: number) => {
    navigate(`/desabafo/${numero}`);
  }, [navigate]);

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

      <main className="app__conteudo">
        {mensagemRedirecionamento && (
          <div className="app__mensagem-redirecionamento" role="alert" aria-live="polite">
            {mensagemRedirecionamento}
          </div>
        )}

        {isAutenticado ? (
          <InputBox onPublicar={handlePublicar} isPublicando={isPublicando} />
        ) : (
          <MensagemLogin />
        )}

        <FeedControls
          filtroAtivo={filtro}
          onFiltroChange={handleFiltroChange}
          totalDesabafos={total}
        />

        {feedError ? (
          <div className="app__erro" role="alert">
            <p>{feedError}</p>
            <button onClick={() => window.location.reload()} type="button">
              Tentar novamente
            </button>
          </div>
        ) : (
          <Feed
            desabafos={desabafosLocal}
            isLoading={isFeedLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onReagir={reagir}
            usuarioAutenticado={isAutenticado}
            reacaoUsuario={reacaoUsuario}
            uid={usuario?.uid ?? null}
            onVerDesabafo={handleVerDesabafo}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Componente App principal com roteamento.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<PaginaFeed />} />
      <Route path="/feed" element={<PaginaFeedPage />} />
      <Route path="/desabafo/:numero" element={<PaginaDesabafo />} />
      <Route path="/trends" element={<PaginaTrends />} />
      <Route
        path="/moderacao"
        element={
          <RotaProtegidaAdmin>
            <PaginaModeracao isAdmin={true} />
          </RotaProtegidaAdmin>
        }
      />
    </Routes>
  );
}

export default App;
