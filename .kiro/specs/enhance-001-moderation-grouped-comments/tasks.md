# Implementation Plan: Moderation Grouped Comments

## Overview

Refatoração da `PaginaModeracao` para: substituir a seção plana de comentários por linhas expansíveis com carregamento lazy; adicionar paginação de 25 desabafos por vez com cursor; adicionar campo de busca por número incremental (depende do campo `numero` da `feature-003-desabafo-page`).

## Tasks

- [x] 1. Atualizar serviço buscarTodosDesabafosAdmin para suportar paginação
  - Adicionar parâmetros `limite` e `cursor?: DocumentSnapshot` à função em `src/firebase/admin.ts`
  - Retornar `{ desabafos, ultimoDoc }` em vez de apenas o array
  - Adicionar nova função `buscarDesabafoAdminPorNumero(numero: number)` usando `where('numero', '==', numero)`
  - _Requirements: 6.1, 6.3, 7.2_

- [x] 2. Atualizar estado e lógica de carregamento da PaginaModeracao
  - Remover estado `comentarios` e o fetch de `buscarTodosComentariosAdmin` do carregamento inicial
  - Adicionar estados de paginação: `lastDoc`, `hasMore`, `isLoadingMore`
  - Adicionar estados de comentários inline: `expandedDesabafoIds`, `comentariosPorDesabafo`, `loadingComentarios`, `erroComentarios`
  - Adicionar estados de busca: `buscaNumero`, `modoBusca`
  - Implementar `toggleDesabafo(id)` com lógica de cache
  - Implementar `carregarMais()` que usa `lastDoc` como cursor
  - _Requirements: 2.1, 2.2, 2.3, 4.2, 6.1, 6.2, 6.4_

- [x] 3. Implementar campo de busca por número
  - Adicionar input de busca e botões "Buscar" / "Limpar" acima da lista
  - Handler de busca: valida inteiro positivo, chama `buscarDesabafoAdminPorNumero`, exibe resultado ou mensagem de não encontrado
  - Handler de limpar: restaura lista paginada normal, oculta paginação quando em modo busca
  - Campo desabilitado com placeholder indicativo quando `numero` não estiver disponível nos dados
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 4. Adicionar toggle expansível e badge à linha de cada desabafo
  - Adicionar botão de toggle à Desabafo_Row com texto do Badge_Comentários
  - Desabilitar o toggle quando `totalComentarios === 0`
  - Exibir ícone direcional (▶/▼) conforme estado expandido/recolhido
  - Exibir `#numero` na row quando disponível
  - _Requirements: 1.1, 1.5, 5.1, 5.3, 7.1_

- [x] 5. Implementar carregamento lazy de comentários por desabafo
  - Chamar `buscarComentarios(id)` dentro de `toggleDesabafo` apenas na primeira expansão
  - Exibir spinner de carregamento dentro da linha enquanto busca
  - Exibir mensagem de erro dentro da linha se a busca falhar, mantendo o toggle ativo
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 6. Renderizar comentários inline e botão "Carregar mais"
  - Exibir comentários abaixo da linha do desabafo quando expandido
  - Cada comentário: texto (até 100 chars), tempo relativo, botão "Remover"
  - Handler de remoção: confirmação via `ConfirmDialog`, atualiza `comentariosPorDesabafo` e decrementa badge
  - Exibir botão "Carregar mais 25" no final da lista quando `hasMore === true`
  - Desabilitar botão e exibir indicador enquanto `isLoadingMore === true`
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 5.2, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Remover a seção separada de "Comentários" da página
  - Remover o bloco JSX da seção plana de comentários
  - Remover variáveis de estado e handlers exclusivos dessa seção
  - _Requirements: 4.1, 4.2_

- [x] 8. Adicionar CSS para o novo layout
  - Estilizar `.pagina-moderacao__busca` (barra de busca com input e botões)
  - Estilizar `.pagina-moderacao__desabafo-toggle` com layout flex e cursor pointer
  - Estilizar `.pagina-moderacao__badge-comentarios` (acento para N > 0, neutro para 0)
  - Estilizar `.pagina-moderacao__comentarios-inline` com indentação e separador visual
  - Estilizar `.pagina-moderacao__comentario-inline-item` com layout flex
  - Estilizar `.pagina-moderacao__carregar-mais` (botão de paginação)
  - _Requirements: 1.1, 5.3, 6.3_

## Notes

- `buscarDesabafoAdminPorNumero` requer index em `numero` — o mesmo index criado pela `feature-003-desabafo-page`; se a feature-003 não estiver implementada, a busca deve estar desabilitada na UI
- A busca por número usa `where('numero', '==', numero)` — retorna no máximo 1 resultado
- A paginação usa `orderBy('criadoEm', 'desc')` + `limit(25)` + `startAfter(cursor)`
- O campo `totalComentarios` do objeto `Desabafo` é a fonte de verdade para o badge inicial

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "7"] },
    { "id": 2, "tasks": ["3", "4"] },
    { "id": 3, "tasks": ["5"] },
    { "id": 4, "tasks": ["6", "8"] }
  ]
}
```
