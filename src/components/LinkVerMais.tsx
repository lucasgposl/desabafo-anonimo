import { Link } from 'react-router-dom';
import './LinkVerMais.css';

export interface LinkVerMaisProps {
  numero: number;
}

export function LinkVerMais({ numero }: LinkVerMaisProps) {
  return (
    <Link
      to={`/desabafo/${numero}`}
      className="link-ver-mais"
      aria-label="Ver todos os comentários"
    >
      ver mais
    </Link>
  );
}
