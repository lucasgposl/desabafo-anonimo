import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  isAdmin?: boolean;
  children?: React.ReactNode;
}

export function Header({ isAdmin = false, children }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__conteudo">
        <div className="header__titulo-grupo">
          <h1 className="header__titulo">Desabafo Anônimo</h1>
          <p className="header__aviso">
            Este site não substitui ajuda profissional. Se precisar, procure um
            psicólogo ou ligue para o CVV (188).
          </p>
        </div>
        <div className="header__acoes">
          {children}
          {isAdmin && (
            <Link to="/moderacao" className="header__link-moderacao">
              Moderação
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
