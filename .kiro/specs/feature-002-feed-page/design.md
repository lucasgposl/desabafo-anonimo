# Design Document

## Overview

Extração do bloco de feed existente em `App.tsx` para um componente de página dedicado `src/pages/PaginaFeed.tsx`, adicionando a rota `/feed` ao roteador. A lógica do feed (hooks, estado, filtro, paginação) é movida sem alteração — nenhuma nova abstração é criada.

## Architecture

| Camada | Mudança |
|--------|---------|
| Roteamento (`App.tsx`) | Adicionar `<Route path="/feed" element={<PaginaFeed />} />` |
| Página (`src/pages/PaginaFeed.tsx`) | Novo arquivo extraído de `App.tsx` |
| Componente (`Header.tsx`) | Adicionar link de navegação para `/feed` |
| Componente (`DesabafoCard.tsx`) | Aceitar prop `onVerDesabafo` para navegação ao clicar |
| Hooks | Nenhum — reutiliza `useDesabafos`, `useAuth`, `useReacoes` |
| Firestore | Nenhuma |

## New File: src/pages/PaginaFeed.tsx

```tsx
// src/pages/PaginaFeed.tsx
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Feed } from '../components/Feed';
import { FeedControls } from '../components/FeedControls';
import { useDesabafos } from '../hooks/useDesabafos';
import { useAuth } from '../hooks/useAuth';

export function PaginaFeed() {
  const navigate = useNavigate();
  const { usuario, isAdmin } = useAuth();
  const {
    desabafos,
    total,
    carregando,
    erro,
    sentimentoFiltro,
    setSentimentoFiltro,
    carregarMais,
    temMais,
  } = useDesabafos();

  function handleVerDesabafo(numero: number) {
    navigate(`/desabafo/${numero}`);
  }

  return (
    <div className="app-container">
      <Header usuario={usuario} isAdmin={isAdmin} />
      <main>
        <FeedControls
          total={total}
          sentimentoFiltro={sentimentoFiltro}
          onFiltroChange={setSentimentoFiltro}
        />
        <Feed
          desabafos={desabafos}
          carregando={carregando}
          erro={erro}
          temMais={temMais}
          onCarregarMais={carregarMais}
          onVerDesabafo={handleVerDesabafo}
        />
      </main>
    </div>
  );
}
```

## Route Addition in App.tsx

```tsx
// App.tsx — adicionar ao BrowserRouter/Routes existente
import { PaginaFeed } from './pages/PaginaFeed';

// Dentro de <Routes>:
<Route path="/feed" element={<PaginaFeed />} />
```

A rota `/` existente e seu conteúdo permanecem sem alteração.

## DesabafoCard — prop onVerDesabafo

```tsx
interface DesabafoCardProps {
  desabafo: Desabafo;
  onVerDesabafo?: (numero: number) => void; // nova prop opcional
  // ... props existentes
}
```

Quando `onVerDesabafo` for fornecida, o card inteiro (ou um botão "Ver desabafo") dispara a navegação. A prop é opcional para manter compatibilidade com os usos existentes.

## Header — link para /feed

```tsx
// Header.tsx — adicionar link de navegação
import { Link } from 'react-router-dom';

// Dentro do cabeçalho, ao lado dos links existentes:
<Link to="/feed">Feed</Link>
```

## Directory Structure

```
src/
├── pages/
│   └── PaginaFeed.tsx   ← novo
├── components/
│   ├── Feed.tsx
│   ├── DesabafoCard.tsx  ← atualizado (prop onVerDesabafo)
│   └── Header.tsx        ← atualizado (link /feed)
└── App.tsx               ← atualizado (rota /feed)
```

## Correctness Properties

### Property 1: Rota /feed não afeta rota /
Para qualquer estado da aplicação, navegar para `/feed` e depois para `/` deve restaurar exatamente o comportamento atual da Página_Inicial, incluindo o formulário de publicação visível para usuários autenticados.

### Property 2: onVerDesabafo é opcional e não quebra usos existentes
Para qualquer render de `DesabafoCard` sem a prop `onVerDesabafo`, o componente deve funcionar exatamente como antes da mudança.
