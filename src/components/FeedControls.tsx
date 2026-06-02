import React from 'react';
import { FeedControlsProps, Sentimento } from '../types';
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
        <option value="triste">Tristeza</option>
        <option value="raiva">Raiva</option>
        <option value="alivio">Alívio</option>
      </select>

      <span className="feed-controls__contador">{contadorTexto}</span>
    </div>
  );
}
