# Implementation Plan: Feed Page

## Overview

Criação da rota `/feed` com o componente `PaginaFeed`, extraído do bloco de feed existente em `App.tsx`, e adição de navegação por clique no card para a futura página do desabafo.

## Tasks

- [ ] 1. Criar estrutura de diretório src/pages/
  - Criar o diretório `src/pages/` caso não exista
  - _Requirements: 1.1_

- [ ] 2. Extrair PaginaFeed de App.tsx para src/pages/PaginaFeed.tsx
  - Criar `src/pages/PaginaFeed.tsx` com o componente `PaginaFeed`
  - Mover para o novo arquivo: `Header`, `FeedControls`, `Feed` e os hooks `useDesabafos`, `useAuth`
  - Sem `InputBox` — a `PaginaFeed` não exibe o formulário de publicação
  - Adicionar handler `handleVerDesabafo(numero)` que navega para `/desabafo/${numero}`
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2_

- [ ] 3. Adicionar rota /feed em App.tsx
  - Importar `PaginaFeed` de `./pages/PaginaFeed`
  - Adicionar `<Route path="/feed" element={<PaginaFeed />} />` dentro do `<Routes>` existente
  - Garantir que a rota `/` e seu comportamento atual não sejam alterados
  - _Requirements: 1.1, 6.1, 6.2_

- [ ] 4. Adicionar prop onVerDesabafo ao DesabafoCard
  - Adicionar prop opcional `onVerDesabafo?: (numero: number) => void` à interface do componente
  - Implementar o clique no card (ou botão "Ver") que dispara `onVerDesabafo(desabafo.numero)` quando fornecida
  - Adicionar `cursor: pointer` ao card quando a prop estiver presente
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5. Adicionar link de navegação para /feed no Header
  - Adicionar `<Link to="/feed">Feed</Link>` no componente `Header`
  - Estilizar o link de forma consistente com os demais elementos do cabeçalho
  - _Requirements: 6.3_

## Notes

- A `PaginaFeed` não inclui `InputBox` — o formulário de publicação permanece exclusivo da rota `/`
- A prop `onVerDesabafo` depende do campo `numero` do desabafo, que será adicionado pela spec `feature-003-desabafo-page`; implementar a prop agora com `numero` possivelmente `undefined` para permitir integração futura
- Os hooks `useDesabafos`, `useAuth` e `useReacoes` não precisam de modificação

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "4"] },
    { "id": 2, "tasks": ["3", "5"] }
  ]
}
```
