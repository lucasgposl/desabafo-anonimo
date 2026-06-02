import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  isAdmin?: boolean;
  children?: React.ReactNode;
}

export function Header({ isAdmin = false, children }: HeaderProps) {
  const { pathname } = useLocation();

  function getLinkClassName(linkPath: string, baseClass: string): string {
    const isActive = pathname.startsWith(linkPath);
    return isActive ? `${baseClass} header__link-nav--ativo` : baseClass;
  }

  return (
    <header className="header">
      <div className="header__conteudo">
        <div className="header__titulo-grupo">
          <h1 className="header__titulo">
            <Link to="/" className="header__titulo-link">
              Desabafo Anônimo
            </Link>
          </h1>
          <p className="header__aviso">
            Este site não substitui ajuda profissional. Se precisar, procure um
            psicólogo ou ligue para o CVV (188).
          </p>
        </div>
        <div className="header__acoes">
          {children}
          <Link to="/feed" className={getLinkClassName('/feed', 'header__link-nav')}>
            Feed
          </Link>
          <Link to="/trends" className={getLinkClassName('/trends', 'header__link-nav')}>
            Trends
          </Link>
          {isAdmin && (
            <Link to="/moderacao" className={getLinkClassName('/moderacao', 'header__link-moderacao')}>
              Moderação
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
