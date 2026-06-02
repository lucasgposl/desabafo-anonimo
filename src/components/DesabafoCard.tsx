import { DesabafoCardProps, TipoReacao } from '../types';
import { REACAO_CONFIG, obterInfoSentimento } from '../config/sentimentos';
import { obterCorSentimento } from '../utils/obterCorSentimento';
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

export function DesabafoCard({ desabafo, onReagir, usuarioAutenticado, reacaoAtiva, uid, onVerDesabafo }: DesabafoCardProps) {
  const handleReagir = (tipo: TipoReacao) => {
    onReagir(tipo);
  };

  const infoSentimento = obterInfoSentimento(desabafo.sentimento);

  const isClicavel = onVerDesabafo != null && desabafo.numero != null;

  const handleClickConteudo = () => {
    if (isClicavel) {
      onVerDesabafo!(desabafo.numero!);
    }
  };

  return (
    <article
      className="desabafo-card"
      style={{ borderLeftColor: obterCorSentimento(desabafo.sentimento) }}
    >
      <div
        className={`desabafo-card__conteudo${isClicavel ? ' desabafo-card__conteudo--clicavel' : ''}`}
        onClick={isClicavel ? handleClickConteudo : undefined}
        role={isClicavel ? 'button' : undefined}
        tabIndex={isClicavel ? 0 : undefined}
        onKeyDown={isClicavel ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClickConteudo(); } : undefined}
        aria-label={isClicavel ? 'Ver desabafo completo' : undefined}
      >
        <p className="desabafo-card__texto">{desabafo.texto}</p>
        <div className="desabafo-card__meta">
          <span className="desabafo-card__sentimento">
            {infoSentimento.emoji} {infoSentimento.label}
          </span>
          <span className="desabafo-card__tempo">
            {formatarTempoRelativo(desabafo.criadoEm)}
          </span>
          {desabafo.numero != null && (
            <span className="desabafo-card__numero">#{desabafo.numero}</span>
          )}
        </div>
      </div>

      <div className="desabafo-card__reacoes">
        {Object.entries(REACAO_CONFIG).map(([chave, entry]) => (
          <button
            key={chave}
            className={`desabafo-card__reacao-btn ${reacaoAtiva === chave ? 'desabafo-card__reacao-btn--ativo' : ''}`}
            onClick={() => handleReagir(chave as TipoReacao)}
            aria-label={entry.label}
            aria-pressed={reacaoAtiva === chave}
          >
            <span className="desabafo-card__reacao-emoji">{entry.emoji}</span>
            <span className="desabafo-card__reacao-label">{entry.label}</span>
            <span className="desabafo-card__reacao-contador">{desabafo.reacoes[chave as TipoReacao] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="desabafo-card__comentarios-section">
        <ComentarioSection
          desabafoId={desabafo.id}
          usuarioAutenticado={usuarioAutenticado}
          uid={uid}
          limite={5}
          mostrarFormulario={true}
        />
        {desabafo.totalComentarios > 5 && desabafo.numero != null && (
          <LinkVerMais numero={desabafo.numero} />
        )}
      </div>
    </article>
  );
}
