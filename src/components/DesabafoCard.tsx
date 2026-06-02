import { DesabafoCardProps, TipoReacao, Sentimento } from '../types';
import { ComentarioSection } from './ComentarioSection';
import { LinkVerMais } from './LinkVerMais';
import './DesabafoCard.css';

function formatarTempoRelativo(data: Date): string {
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffSegundos = Math.floor(diffMs / 1000);

  if (diffSegundos < 60) {
    return 'agora';
  }

  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) {
    return `${diffMinutos} min atrás`;
  }

  const diffHoras = Math.floor(diffSegundos / 3600);
  if (diffHoras < 24) {
    return `${diffHoras} h atrás`;
  }

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function obterCorSentimento(sentimento: Sentimento): string {
  const cores: Record<Sentimento, string> = {
    triste: 'var(--cor-tristeza)',
    raiva: 'var(--cor-raiva)',
    alivio: 'var(--cor-alivio)',
  };
  return cores[sentimento];
}

export function DesabafoCard({ desabafo, onReagir, usuarioAutenticado, reacaoAtiva, uid }: DesabafoCardProps) {
  const handleReagir = (tipo: TipoReacao) => {
    onReagir(tipo);
  };

  return (
    <article
      className="desabafo-card"
      style={{ borderLeftColor: obterCorSentimento(desabafo.sentimento) }}
    >
      <div className="desabafo-card__conteudo">
        <p className="desabafo-card__texto">{desabafo.texto}</p>
        <span className="desabafo-card__tempo">
          {formatarTempoRelativo(desabafo.criadoEm)}
        </span>
      </div>

      <div className="desabafo-card__reacoes">
        <button
          className={`desabafo-card__reacao-btn ${reacaoAtiva === 'apoio' ? 'desabafo-card__reacao-btn--ativo' : ''}`}
          onClick={() => handleReagir('apoio')}
          aria-label="Eu me identifiquei"
          aria-pressed={reacaoAtiva === 'apoio'}
        >
          <span className="desabafo-card__reacao-emoji">🤝</span>
          <span className="desabafo-card__reacao-label">Eu me identifiquei</span>
          <span className="desabafo-card__reacao-contador">{desabafo.reacoes.apoio}</span>
        </button>

        <button
          className={`desabafo-card__reacao-btn ${reacaoAtiva === 'forca' ? 'desabafo-card__reacao-btn--ativo' : ''}`}
          onClick={() => handleReagir('forca')}
          aria-label="Força"
          aria-pressed={reacaoAtiva === 'forca'}
        >
          <span className="desabafo-card__reacao-emoji">💪</span>
          <span className="desabafo-card__reacao-label">Força</span>
          <span className="desabafo-card__reacao-contador">{desabafo.reacoes.forca}</span>
        </button>

        <button
          className={`desabafo-card__reacao-btn ${reacaoAtiva === 'pouco' ? 'desabafo-card__reacao-btn--ativo' : ''}`}
          onClick={() => handleReagir('pouco')}
          aria-label="Eu acho é pouco"
          aria-pressed={reacaoAtiva === 'pouco'}
        >
          <span className="desabafo-card__reacao-emoji">🔥</span>
          <span className="desabafo-card__reacao-label">Eu acho é pouco</span>
          <span className="desabafo-card__reacao-contador">{desabafo.reacoes.pouco}</span>
        </button>
      </div>

      {desabafo.totalComentarios > 0 && (
        <div className="desabafo-card__comentarios-section">
          <ComentarioSection
            desabafoId={desabafo.id}
            usuarioAutenticado={usuarioAutenticado}
            uid={uid}
            limite={5}
            mostrarFormulario={false}
          />
          {desabafo.totalComentarios > 5 && desabafo.numero != null && (
            <LinkVerMais numero={desabafo.numero} />
          )}
        </div>
      )}
    </article>
  );
}
