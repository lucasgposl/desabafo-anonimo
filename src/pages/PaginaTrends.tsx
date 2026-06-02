import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { useTrends } from '../hooks/useTrends';
import { useReacoes } from '../hooks/useReacoes';

import { Header } from '../components/Header';
import { LoginButton } from '../components/LoginButton';
import { Feed } from '../components/Feed';
import { Footer } from '../components/Footer';

import type { Desabafo } from '../types';
import './PaginaTrends.css';

/**
 * Página Trends (rota /trends).
 * Exibe os desabafos com mais interações nos últimos 30 dias,
 * ordenados por popularidade (total de reações + comentários).
 *
 * - Usa useTrends para buscar e paginar os desabafos
 * - Usa useReacoes para optimistic updates sem reordenar a lista
 * - Trata estados: loading, empty, error
 */
export function PaginaTrends() {
  const { usuario, isLoading: isAuthLoading, isAutenticado, login, logout } = useAuth();
  const { isAdmin } = useAdmin(usuario?.uid ?? null);
  const navigate = useNavigate();

  const {
    desabafos: desabafosHook,
    isLoading,
    error,
    hasMore,
    loadMore,
  } = useTrends();

  // Estado local dos desabafos para optimistic updates nas reações
  // sem reordenar a lista (mantém posição estável)
  const [desabafosLocal, setDesabafosLocal] = useState<Desabafo[]>([]);

  // Sincronizar estado local com o hook quando os dados mudam
  useEffect(() => {
    setDesabafosLocal(desabafosHook);
  }, [desabafosHook]);

  const { reagir, reacaoUsuario } = useReacoes(desabafosLocal, setDesabafosLocal);

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
        <h2 className="pagina-trends__header">
          Desabafos com mais interações nos últimos 30 dias
        </h2>

        {error ? (
          <div className="pagina-trends__erro" role="alert">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} type="button">
              Tentar novamente
            </button>
          </div>
        ) : !isLoading && desabafosLocal.length === 0 ? (
          <div className="pagina-trends__vazio" aria-label="Nenhum desabafo em alta">
            <p>Não há desabafos em alta no momento.</p>
          </div>
        ) : (
          <Feed
            desabafos={desabafosLocal}
            isLoading={isLoading}
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

      <Footer />
    </div>
  );
}
