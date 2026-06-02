import React from 'react';
import { FeedControlsProps, Sentimento } from '../types';
import { SENTIMENTO_CONFIG, sentimentosPorCategoria, CATEGORIAS } from '../config/sentimentos';
import './FeedControls.css';

export function FeedControls({ filtroAtivo, onFiltroChange, totalDesabafos }: FeedControlsProps) {
  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltroChange(e.target.value as Sentimento | 'todos');
  };

  const contadorTexto = totalDesabafos === 1
    ? '1 desabafo'
    : `${totalDesabafos} desabafos`;

  return (
    <div className="feed-controls">
      <select
        className="feed-controls__filtro"
        value={filtroAtivo}
        onChange={handleFiltroChange}
        aria-label="Filtrar por sentimento"
      >
        <option value="todos">Todos</option>
        {Object.entries(sentimentosPorCategoria()).map(([cat, chaves]) => (
          <optgroup key={cat} label={CATEGORIAS[cat as keyof typeof CATEGORIAS]}>
            {chaves.map((chave) => (
              <option key={chave} value={chave}>
                {SENTIMENTO_CONFIG[chave].emoji} {SENTIMENTO_CONFIG[chave].label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <span className="feed-controls__contador">{contadorTexto}</span>
    </div>
  );
}
