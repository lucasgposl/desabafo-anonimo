# Implementation Plan: Feed Page

## Overview

Criação da rota `/feed` com o componente `PaginaFeed`, extraído do bloco de feed existente em `App.tsx`, e adição de navegação por clique no card para a futura página do desabafo.

## Tasks

- [x] 1. Criar estrutura de diretório src/pages/
  - Criar o diretório `src/pages/` caso não exista
  - _Requirements: 1.1_

- [x] 2. Extrair PaginaFeed de App.tsx para src/pages/PaginaFeed.tsx
  - Criar `src/pages/PaginaFeed.tsx` com o componente `PaginaFeed`
  - Mover para o novo arquivo: `Header`, `FeedControls`, `Feed` e os hooks `useDesabafos`, `useAuth`
  - Sem `InputBox` — a `PaginaFeed` não exibe o formulário de publicação
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2_

- [x] 3. Adicionar rota /feed em App.tsx
  - Importar `PaginaFeed` de `./pages/PaginaFeed`
  - Adicionar `<Route path="/feed" element={<PaginaFeed />} />` dentro do `<Routes>` existente
  - Garantir que a rota `/` e seu comportamento atual não sejam alterados
  - _Requirements: 1.1, 6.1, 6.2_

- [x] 4. Tornar DesabafoCard clicável para navegação (complementar ao LinkVerMais)
  - Adicionar prop opcional `onVerDesabafo?: (numero: number) => void` à interface `DesabafoCardProps` em `src/types/index.ts`
  - No `DesabafoCard`: envolver o bloco `.desabafo-card__conteudo` em um elemento clicável que dispara `onVerDesabafo(desabafo.numero)` quando a prop estiver presente e `desabafo.numero` definido
  - Adicionar `cursor: pointer` ao conteúdo do card quando a prop estiver presente
  - **Nota:** O `LinkVerMais` já existe (implementado via enhance-002) e navega para `/desabafo/:numero` quando há mais de 5 comentários. Esta task adiciona navegação pelo card inteiro como alternativa complementar.
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5. Adicionar link de navegação para /feed no Header
  - Adicionar `<Link to="/feed">Feed</Link>` no componente `Header`
  - Estilizar o link de forma consistente com os demais elementos do cabeçalho
  - _Requirements: 6.3_

## Notes

- A `PaginaFeed` não inclui `InputBox` — o formulário de publicação permanece exclusivo da rota `/`
- O campo `numero` já existe na interface `Desabafo` (adicionado por enhance-002). A prop `onVerDesabafo` deve tratar `numero` possivelmente `undefined` (desabafos legados) — nesse caso, não tornar o card clicável
- O `LinkVerMais` (enhance-002) já provê navegação para `/desabafo/:numero` quando `totalComentarios > 5`. A task 4 é complementar: permite navegar pelo clique no card inteiro, independente da quantidade de comentários
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
