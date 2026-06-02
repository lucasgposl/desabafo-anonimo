import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__conteudo">
        <span className="footer__copyright">© {anoAtual} Desabafo Anônimo</span>
        <Link to="/sobre" className="footer__link">Sobre</Link>
      </div>
    </footer>
  );
}
