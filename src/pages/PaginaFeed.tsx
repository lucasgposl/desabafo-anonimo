import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { useDesabafos } from '../hooks/useDesabafos';
import { useReacoes } from '../hooks/useReacoes';

import { Header } from '../components/Header';
import { LoginButton } from '../components/LoginButton';
import { FeedControls } from '../components/FeedControls';
import { Feed } from '../components/Feed';

import type { Sentimento, Desabafo } from '../types';

/**
 * Página dedicada ao feed de desabafos (rota /feed).
 * Exibe Header, FeedControls e Feed — sem formulário de publicação (InputBox).
 */
export function PaginaFeed() {
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
  } = useDesabafos(filtro);

  // Estado local dos desabafos para permitir optimistic updates nas reações
  const [desabafosLocal, setDesabafosLocal] = useState<Desabafo[]>([]);

  // Sincronizar estado local com o hook quando os dados mudam
  useEffect(() => {
    setDesabafosLocal(desabafosHook);
  }, [desabafosHook]);

  const { reagir, reacaoUsuario } = useReacoes(desabafosLocal, setDesabafosLocal);

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
