# Implementation Plan: Desabafo Page

## Overview

Adição do campo `numero` incremental ao tipo `Desabafo`, geração atômica via transação Firestore, criação do hook `useDesabafo`, novo componente `PaginaDesabafo` e rota `/desabafo/:numero`. Desabafos legados sem `numero` permanecem funcionais.

## Tasks

- [ ] 1. Adicionar campo numero aos tipos Desabafo e DesabafoDoc
  - Adicionar `numero?: number` à interface `DesabafoDoc` em `src/types.ts` (ou arquivo de tipos equivalente)
  - Adicionar `numero?: number` à interface `Desabafo`
  - _Requirements: 1.4, 7.3_

- [ ] 2. Atualizar criarDesabafo para usar transação e gerar numero
  - Envolver a criação do desabafo em `runTransaction` em `src/firebase/desabafos.ts`
  - Dentro da transação: ler `config/counters`, incrementar `totalDesabafos`, usar o novo valor como `numero` do desabafo
  - Criar o documento `config/counters` com `totalDesabafos: 1` caso não exista (usando `merge: true`)
  - Garantir que o campo `numero` seja incluído no documento criado na coleção `desabafos`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2_

- [ ] 3. Atualizar regras de segurança do Firestore para config/counters
  - Adicionar ao `firestore.rules` a regra `match /config/counters` com leitura pública (`allow read: if true`) e escrita apenas autenticada (`allow write: if request.auth != null`)
  - Fazer deploy das regras atualizadas
  - _Requirements: 6.3, 6.4_

- [ ] 4. Criar hook useDesabafo
  - Criar `src/hooks/useDesabafo.ts`
  - Implementar busca por `where('numero', '==', numero)` na coleção `desabafos`
  - Retornar `{ desabafo, carregando, naoEncontrado, erro }`
  - Tratar `numero` inválido (NaN, negativo) retornando `naoEncontrado: true` sem consultar o Firestore
  - _Requirements: 2.2, 5.1, 5.3_

- [ ] 5. Criar componente PaginaDesabafo
  - Criar `src/pages/PaginaDesabafo.tsx`
  - Usar `useParams` para obter `:numero` e `parseInt` para converter
  - Usar `useDesabafo`, `useAuth` e `useReacoes`
  - Exibir: `Header`, texto completo do desabafo, badge de sentimento, tempo relativo, badge `#numero`, botões de reação com contadores
  - Exibir todos os comentários via `ComentarioSection` sem limite de 50
  - Exibir estado de carregamento, mensagem de não encontrado (com link de retorno) e mensagem de erro
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3_

- [ ] 6. Adicionar rota /desabafo/:numero em App.tsx
  - Importar `PaginaDesabafo` de `./pages/PaginaDesabafo`
  - Adicionar `<Route path="/desabafo/:numero" element={<PaginaDesabafo />} />` dentro do `<Routes>` existente
  - _Requirements: 2.1_

- [ ] 7. Exibir badge de numero no DesabafoCard
  - Adicionar exibição do badge `#N` (ex: `<span className="desabafo-card__numero">#42</span>`) quando `desabafo.numero` existir
  - Não renderizar o badge quando `numero` for `undefined` (desabafos legados)
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 8. Tornar DesabafoCard clicável para navegar à PaginaDesabafo
  - Usar a prop `onVerDesabafo` adicionada pela spec `feature-002-feed-page` para disparar `navigate('/desabafo/${desabafo.numero}')` ao clicar no card
  - Desabilitar ou omitir a navegação quando `desabafo.numero` for `undefined`
  - _Requirements: 4.1, 4.2_

## Notes

- O index de campo único em `numero` na coleção `desabafos` deve ser adicionado ao `firestore.indexes.json` para suportar o `where('numero', '==', ...)` sem erro de index ausente
- A `ComentarioSection` usada na `PaginaDesabafo` deve buscar todos os comentários sem o limite de 50 atualmente aplicado no feed — verificar se o serviço `buscarComentarios` aceita um parâmetro de limite ou se é necessário criar uma variante sem limite
- Desabafos legados (sem `numero`) não terão `PaginaDesabafo` acessível por URL — comportamento aceitável para o MVP, conforme nota de migração no design

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "3", "4"] },
    { "id": 2, "tasks": ["5", "7"] },
    { "id": 3, "tasks": ["6", "8"] }
  ]
}
```
