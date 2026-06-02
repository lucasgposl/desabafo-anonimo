import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { LoginButton } from '../components/LoginButton';
import { ComentarioSection } from '../components/ComentarioSection';
import { useDesabafo } from '../hooks/useDesabafo';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { incrementarReacao } from '../firebase/desabafos';
import { formatarTempoRelativo } from '../utils/tempoRelativo';
import type { Desabafo, TipoReacao, Sentimento } from '../types';
import './PaginaDesabafo.css';

function obterCorSentimento(sentimento: Sentimento): string {
  const cores: Record<Sentimento, string> = {
    triste: 'var(--cor-tristeza)',
    raiva: 'var(--cor-raiva)',
    alivio: 'var(--cor-alivio)',
  };
  return cores[sentimento];
}

function obterLabelSentimento(sentimento: Sentimento): string {
  const labels: Record<Sentimento, string> = {
    triste: 'Tristeza',
    raiva: 'Raiva',
    alivio: 'Alívio',
  };
  return labels[sentimento];
}

export function PaginaDesabafo() {
  const { numero } = useParams<{ numero: string }>();
  const numeroInt = parseInt(numero ?? '', 10);

  const { usuario, isLoading: isAuthLoading, isAutenticado, login, logout } = useAuth();
  const { isAdmin } = useAdmin(usuario?.uid ?? null);
  const { desabafo, carregando, naoEncontrado, erro } = useDesabafo(
    isNaN(numeroInt) ? -1 : numeroInt
  );

  // Estado local do desabafo para optimistic updates nas reações
  const [desabafoLocal, setDesabafoLocal] = useState<Desabafo | null>(null);
  const [reacaoAtiva, setReacaoAtiva] = useState<TipoReacao | null>(null);

  useEffect(() => {
    setDesabafoLocal(desabafo);
  }, [desabafo]);

  const handleReagir = useCallback(
    async (tipo: TipoReacao) => {
      if (!desabafoLocal) return;

      // Se já reagiu com o mesmo tipo, ignorar
      if (reacaoAtiva === tipo) return;

      const reacaoAnterior = reacaoAtiva;

      // Optimistic update
      setDesabafoLocal((prev) => {
        if (!prev) return prev;
        const novasReacoes = { ...prev.reacoes, [tipo]: prev.reacoes[tipo] + 1 };
        if (reacaoAnterior) {
          novasReacoes[reacaoAnterior] = prev.reacoes[reacaoAnterior] - 1;
        }
        return { ...prev, reacoes: novasReacoes };
      });
      setReacaoAtiva(tipo);

      try {
        await incrementarReacao(desabafoLocal.id, tipo);
      } catch {
        // Rollback
        setDesabafoLocal((prev) => {
          if (!prev) return prev;
          const novasReacoes = { ...prev.reacoes, [tipo]: prev.reacoes[tipo] - 1 };
          if (reacaoAnterior) {
            novasReacoes[reacaoAnterior] = prev.reacoes[reacaoAnterior] + 1;
          }
          return { ...prev, reacoes: novasReacoes };
        });
        setReacaoAtiva(reacaoAnterior);
      }
    },
    [desabafoLocal, reacaoAtiva]
  );

  if (carregando) {
    return (
      <div className="pagina-desabafo__loading" role="status" aria-live="polite">
        Carregando...
      </div>
    );
  }

  if (naoEncontrado || isNaN(numeroInt)) {
    return (
      <div className="pagina-desabafo__nao-encontrado">
        <p>Desabafo não encontrado.</p>
        <Link to="/feed" className="pagina-desabafo__link-voltar">
          Voltar ao feed
        </Link>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="pagina-desabafo__erro" role="alert">
        {erro}
      </div>
    );
  }

  if (!desabafoLocal) return null;

  return (
    <div className="app-container">
      <Header isAdmin={isAdmin}>
        <LoginButton
          usuario={usuario}
          onLogin={login}
          onLogout={logout}
          isLoading={isAuthLoading}
        />
      </Header>

      <main className="pagina-desabafo">
        <article
          className="pagina-desabafo__card"
          style={{ borderLeftColor: obterCorSentimento(desabafoLocal.sentimento) }}
        >
          <div className="pagina-desabafo__meta">
            {desabafoLocal.numero != null && (
              <span className="pagina-desabafo__numero">#{desabafoLocal.numero}</span>
            )}
            <span className="pagina-desabafo__sentimento-badge">
              {obterLabelSentimento(desabafoLocal.sentimento)}
            </span>
            <span className="pagina-desabafo__tempo">
              {formatarTempoRelativo(desabafoLocal.criadoEm, new Date())}
            </span>
          </div>

          <p className="pagina-desabafo__texto">{desabafoLocal.texto}</p>

          <div className="pagina-desabafo__reacoes">
            <button
              className={`pagina-desabafo__reacao-btn ${reacaoAtiva === 'apoio' ? 'pagina-desabafo__reacao-btn--ativo' : ''}`}
              onClick={() => handleReagir('apoio')}
              aria-label="Eu me identifiquei"
              aria-pressed={reacaoAtiva === 'apoio'}
            >
              <span className="pagina-desabafo__reacao-emoji">🤝</span>
              <span className="pagina-desabafo__reacao-label">Eu me identifiquei</span>
              <span className="pagina-desabafo__reacao-contador">{desabafoLocal.reacoes.apoio}</span>
            </button>

            <button
              className={`pagina-desabafo__reacao-btn ${reacaoAtiva === 'forca' ? 'pagina-desabafo__reacao-btn--ativo' : ''}`}
              onClick={() => handleReagir('forca')}
              aria-label="Força"
              aria-pressed={reacaoAtiva === 'forca'}
            >
              <span className="pagina-desabafo__reacao-emoji">💪</span>
              <span className="pagina-desabafo__reacao-label">Força</span>
              <span className="pagina-desabafo__reacao-contador">{desabafoLocal.reacoes.forca}</span>
            </button>

            <button
              className={`pagina-desabafo__reacao-btn ${reacaoAtiva === 'pouco' ? 'pagina-desabafo__reacao-btn--ativo' : ''}`}
              onClick={() => handleReagir('pouco')}
              aria-label="Eu acho é pouco"
              aria-pressed={reacaoAtiva === 'pouco'}
            >
              <span className="pagina-desabafo__reacao-emoji">🔥</span>
              <span className="pagina-desabafo__reacao-label">Eu acho é pouco</span>
              <span className="pagina-desabafo__reacao-contador">{desabafoLocal.reacoes.pouco}</span>
            </button>
          </div>
        </article>

        <ComentarioSection
          desabafoId={desabafoLocal.id}
          usuarioAutenticado={isAutenticado}
          uid={usuario?.uid ?? null}
          mostrarFormulario={true}
        />
      </main>
    </div>
  );
}
