# Implementation Plan: Desabafo Page

## Overview

Geração atômica do campo `numero` via transação Firestore, criação do hook `useDesabafo`, novo componente `PaginaDesabafo` e rota `/desabafo/:numero`. Desabafos legados sem `numero` permanecem funcionais.

## Tasks

- [x] 1. Adicionar campo numero aos tipos Desabafo e DesabafoDoc
  - ~~Adicionar `numero?: number` à interface `DesabafoDoc` em `src/types/index.ts`~~
  - ~~Adicionar `numero?: number` à interface `Desabafo`~~
  - **Já implementado pela enhance-002-feed-comment-pagination (task 1.1).** O campo `numero?: number` já existe em ambas as interfaces.
  - _Requirements: 1.4, 7.3_

- [x] 2. Atualizar criarDesabafo para usar transação e gerar numero
  - Envolver a criação do desabafo em `runTransaction` em `src/firebase/desabafos.ts`
  - Dentro da transação: ler `config/counters`, incrementar `totalDesabafos`, usar o novo valor como `numero` do desabafo
  - Criar o documento `config/counters` com `totalDesabafos: 1` caso não exista (usando `merge: true`)
  - Garantir que o campo `numero` seja incluído no documento criado na coleção `desabafos`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2_

- [x] 3. Atualizar regras de segurança do Firestore para config/counters
  - Adicionar ao `firestore.rules` a regra `match /config/counters` com leitura pública (`allow read: if true`) e escrita apenas autenticada (`allow write: if request.auth != null`)
  - Fazer deploy das regras atualizadas
  - _Requirements: 6.3, 6.4_

- [x] 4. Criar hook useDesabafo
  - Criar `src/hooks/useDesabafo.ts`
  - Implementar busca por `where('numero', '==', numero)` na coleção `desabafos`
  - Retornar `{ desabafo, carregando, naoEncontrado, erro }`
  - Tratar `numero` inválido (NaN, negativo) retornando `naoEncontrado: true` sem consultar o Firestore
  - _Requirements: 2.2, 5.1, 5.3_

- [x] 5. Criar componente PaginaDesabafo
  - Criar `src/pages/PaginaDesabafo.tsx`
  - Usar `useParams` para obter `:numero` e `parseInt` para converter
  - Usar `useDesabafo`, `useAuth` e `useReacoes`
  - Exibir: `Header`, texto completo do desabafo, badge de sentimento, tempo relativo, badge `#numero`, botões de reação com contadores
  - Exibir todos os comentários via `<ComentarioSection desabafoId={id} usuarioAutenticado={auth} uid={uid} mostrarFormulario={true} />` (sem prop `limite` — o default já busca todos os comentários, conforme enhance-002 task 6.1)
  - Exibir estado de carregamento, mensagem de não encontrado (com link de retorno) e mensagem de erro
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3_

- [x] 6. Adicionar rota /desabafo/:numero em App.tsx
  - Importar `PaginaDesabafo` de `./pages/PaginaDesabafo`
  - Adicionar `<Route path="/desabafo/:numero" element={<PaginaDesabafo />} />` dentro do `<Routes>` existente
  - _Requirements: 2.1_

- [x] 7. Exibir badge de numero no DesabafoCard
  - Adicionar exibição do badge `#N` (ex: `<span className="desabafo-card__numero">#42</span>`) quando `desabafo.numero` existir
  - Não renderizar o badge quando `numero` for `undefined` (desabafos legados)
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. Integrar navegação do DesabafoCard com PaginaDesabafo
  - Usar a prop `onVerDesabafo` (adicionada pela feature-002-feed-page) na `PaginaFeed` para disparar `navigate('/desabafo/${desabafo.numero}')` ao clicar no card
  - Desabilitar ou omitir a navegação quando `desabafo.numero` for `undefined`
  - **Nota:** O `LinkVerMais` (enhance-002) já provê navegação quando `totalComentarios > 5`. Esta task conecta a navegação via clique no card inteiro.
  - _Requirements: 4.1, 4.2_

## Notes

- O index de campo único em `numero` na coleção `desabafos` deve ser adicionado ao `firestore.indexes.json` para suportar o `where('numero', '==', ...)` sem erro de index ausente
- ~~A `ComentarioSection` usada na `PaginaDesabafo` deve buscar todos os comentários sem o limite de 50~~ — **Resolvido pela enhance-002:** o `ComentarioSection` sem prop `limite` usa fallback de 10000, efetivamente buscando todos os comentários. Basta usar `<ComentarioSection mostrarFormulario={true} />` sem especificar `limite`.
- O campo `numero?: number` já existe nas interfaces `Desabafo` e `DesabafoDoc` (enhance-002 task 1.1)
- Desabafos legados (sem `numero`) não terão `PaginaDesabafo` acessível por URL — comportamento aceitável para o MVP, conforme nota de migração no design

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2", "3", "4"] },
    { "id": 1, "tasks": ["5", "7"] },
    { "id": 2, "tasks": ["6", "8"] }
  ]
}
```
