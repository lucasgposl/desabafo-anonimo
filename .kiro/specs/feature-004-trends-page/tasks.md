# Implementation Plan: Trends Page (feature-004-trends-page)

## Overview

Implementar a página Trends que exibe os desabafos mais populares dos últimos 30 dias, ordenados por total de interações (reações + comentários). A implementação segue uma abordagem bottom-up: primeiro as funções utilitárias puras, depois a camada Firebase, o hook de estado, a página e por fim a integração com rotas e navegação.

## Tasks

- [x] 1. Criar funções utilitárias puras de trends
  - [x] 1.1 Implementar funções utilitárias em src/utils/trends.ts
    - Criar arquivo `src/utils/trends.ts` com as funções: `calcularTotalInteracoes`, `ordenarPorPopularidade`, `paginar`
    - `calcularTotalInteracoes(desabafo)`: retorna soma de `reacoes.apoio + reacoes.forca + reacoes.pouco + totalComentarios`, tratando campos ausentes como 0
    - `ordenarPorPopularidade(desabafos)`: retorna novo array ordenado por `totalInteracoes` desc, tiebreaker por `criadoEm` desc (mais recente primeiro)
    - `paginar<T>(items, pagina, tamanhoPagina = 10)`: retorna fatia do array para a página (1-indexed)
    - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.3_

  - [x]* 1.2 Write property test: calcularTotalInteracoes
    - **Property 1: Total de interações é calculado corretamente**
    - Gerar desabafos com reações aleatórias (0-9999) e verificar que o resultado é a soma exata dos 4 campos
    - Usar `fast-check` com mínimo 100 iterações
    - **Validates: Requirements 4.1**

  - [x]* 1.3 Write property test: ordenarPorPopularidade (ordenação decrescente)
    - **Property 2: Ordenação decrescente por total de interações**
    - Gerar listas de 0-100 desabafos com scores variados e verificar que cada posição i tem totalInteracoes >= posição i+1
    - Usar `fast-check` com mínimo 100 iterações
    - **Validates: Requirements 1.2, 4.2**

  - [x]* 1.4 Write property test: ordenarPorPopularidade (tiebreaker)
    - **Property 3: Tiebreaker por data mais recente**
    - Gerar listas com desabafos de scores duplicados e datas variadas, verificar que pares adjacentes com mesmo score estão ordenados por criadoEm desc
    - Usar `fast-check` com mínimo 100 iterações
    - **Validates: Requirements 4.3**

  - [x]* 1.5 Write property test: paginar (preserva ordem e integridade)
    - **Property 5: Paginação preserva ordem e integridade**
    - Gerar arrays de 0-200 itens, verificar que `paginar(items, pagina, 10)` retorna fatia correta e que a concatenação de todas as páginas válidas é igual ao array original
    - Usar `fast-check` com mínimo 100 iterações
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 2. Implementar função Firebase de busca de trends
  - [x] 2.1 Adicionar buscarDesabafosTrends em src/firebase/desabafos.ts
    - Adicionar função `buscarDesabafosTrends()` ao arquivo existente `src/firebase/desabafos.ts`
    - Query: `where('criadoEm', '>=', Timestamp.fromDate(thirtyDaysAgo))` com `orderBy('criadoEm', 'desc')`
    - Calcular `thirtyDaysAgo` como `new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)`
    - Retorna `Promise<Desabafo[]>` com todos os desabafos do período (sem uid)
    - Reutilizar o mesmo pattern de conversão já usado em `buscarDesabafos`
    - _Requirements: 3.1, 3.2_

  - [x]* 2.2 Write property test: filtro de 30 dias
    - **Property 4: Filtro de 30 dias**
    - Testar a lógica de cálculo do período (não a query Firestore em si): gerar desabafos com `criadoEm` em range amplo (60 dias antes até agora), aplicar filtro e verificar que todos no resultado têm criadoEm >= (now - 30 dias)
    - Usar `fast-check` com mínimo 100 iterações
    - **Validates: Requirements 3.1, 3.2**

- [x] 3. Implementar hook useTrends
  - [x] 3.1 Criar hook useTrends em src/hooks/useTrends.ts
    - Criar arquivo `src/hooks/useTrends.ts`
    - Interface de retorno: `{ desabafos, isLoading, error, hasMore, loadMore, total }`
    - Na montagem: chamar `buscarDesabafosTrends()` via `operacaoSegura` com timeout 10s
    - Após fetch: calcular `totalInteracoes` com `calcularTotalInteracoes`, ordenar com `ordenarPorPopularidade`
    - Gerenciar paginação client-side com `paginar`: exibir página 1 (10 itens) inicialmente
    - `loadMore`: incrementar página e concatenar próximos 10 itens aos já exibidos
    - `hasMore`: true enquanto existem itens não exibidos
    - `error`: mensagem "Não foi possível carregar os desabafos em alta." em caso de falha
    - _Requirements: 1.2, 3.1, 3.4, 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2_

  - [x]* 3.2 Write unit tests for useTrends
    - Testar estados: loading inicial, sucesso com dados, erro/timeout, lista vazia
    - Testar paginação: loadMore incrementa itens exibidos, hasMore false quando todos exibidos
    - Mock de `buscarDesabafosTrends` e `operacaoSegura`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

- [x] 4. Checkpoint - Verificar camada de dados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar página e navegação
  - [x] 5.1 Criar componente PaginaTrends em src/pages/PaginaTrends.tsx
    - Criar arquivo `src/pages/PaginaTrends.tsx`
    - Importar e usar: `useAuth`, `useAdmin`, `useTrends`, `useReacoes`
    - Renderizar: `Header` (com `LoginButton`), heading h2 explicativo (HeaderTrends inline), `Feed`
    - O h2 deve informar que são os desabafos com mais interações nos últimos 30 dias
    - Passar desabafos do `useTrends` para o `Feed` (com optimistic updates via `useReacoes`)
    - Tratar estados: loading (indicador de carregamento), empty (mensagem "Não há desabafos em alta no momento."), error (mensagem + botão "Tentar novamente")
    - Manter posição dos desabafos estável após reação (sem reordenar)
    - _Requirements: 1.2, 1.4, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4_

  - [x] 5.2 Criar CSS para PaginaTrends em src/pages/PaginaTrends.css
    - Estilizar o HeaderTrends (h2 explicativo) seguindo o mesmo padrão visual das demais páginas
    - Garantir visibilidade no viewport inicial em dispositivos com largura mínima 360px
    - _Requirements: 5.3_

  - [x] 5.3 Adicionar link "Trends" no Header em src/components/Header.tsx
    - Adicionar `<Link to="/trends" className="header__link-nav">Trends</Link>` após o link "Feed" e antes do link "Moderação"
    - Visível para todos (autenticados e visitantes), sem condição de autenticação
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.4 Registrar rota /trends em src/App.tsx
    - Adicionar `<Route path="/trends" element={<PaginaTrends />} />` no componente App
    - Importar `PaginaTrends` de `./pages/PaginaTrends`
    - _Requirements: 1.1, 1.3_

- [x] 6. Checkpoint - Verificar integração completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Testes de integração e unit tests da página
  - [x]* 7.1 Write unit tests for PaginaTrends
    - Testar renderização: Header presente, h2 explicativo presente, Feed presente
    - Testar estados: loading indicator, empty state message, error state com botão retry
    - Testar que reação não reordena a lista
    - _Requirements: 5.1, 5.2, 8.1, 8.2, 8.3, 8.4_

  - [x]* 7.2 Write unit test for Header com link Trends
    - Verificar que link "Trends" está presente com href `/trends`
    - Verificar posição: após "Feed", antes de "Moderação"
    - _Requirements: 2.1, 2.2, 2.3_

  - [x]* 7.3 Write unit test for rota /trends
    - Verificar que navegar para `/trends` renderiza PaginaTrends
    - _Requirements: 1.1, 1.3_

- [x] 8. Final checkpoint - Validação completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- A biblioteca `fast-check` já está instalada no projeto
- O projeto usa Jest + Testing Library para testes
- Todas as funções utilitárias em `src/utils/trends.ts` são puras e testáveis isoladamente

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "2.2"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3"] }
  ]
}
```
