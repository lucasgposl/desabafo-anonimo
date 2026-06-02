import { FeedProps } from '../types';
import { DesabafoCard } from './DesabafoCard';
import './Feed.css';

export function Feed({
  desabafos,
  isLoading,
  hasMore,
  onLoadMore,
  onReagir,
  usuarioAutenticado,
  reacaoUsuario,
  uid,
}: FeedProps) {
  if (isLoading && desabafos.length === 0) {
    return (
      <div className="feed">
        <div className="feed__loading" aria-label="Carregando desabafos">
          <div className="feed__loading-pulso"></div>
          <p className="feed__loading-texto">Carregando desabafos...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && desabafos.length === 0) {
    return (
      <div className="feed">
        <div className="feed__vazio" aria-label="Nenhum desabafo encontrado">
          <p className="feed__vazio-texto">
            Nenhum desabafo por aqui ainda. Seja o primeiro a compartilhar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed">
      <div className="feed__lista">
        {desabafos.map((desabafo) => (
          <DesabafoCard
            key={desabafo.id}
            desabafo={desabafo}
            onReagir={(tipo) => onReagir(desabafo.id, tipo)}
            usuarioAutenticado={usuarioAutenticado}
            reacaoAtiva={reacaoUsuario?.[desabafo.id] ?? null}
            uid={uid}
          />
        ))}
      </div>

      {isLoading && (
        <div className="feed__loading feed__loading--inline" aria-label="Carregando mais desabafos">
          <div className="feed__loading-pulso"></div>
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          className="feed__carregar-mais"
          onClick={onLoadMore}
          type="button"
        >
          Carregar mais
        </button>
      )}
    </div>
  );
}
