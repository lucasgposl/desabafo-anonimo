# Implementation Plan: Admin Management

## Overview

Extensão do serviço de admin e da PaginaModeracao para permitir que admins gerenciem outros admins pela UI.

## Tasks

- [x] 1. Atualizar serviço Firebase de admin
  - [x] 1.1 Adicionar funções de gestão de admins
    - Adicionar `buscarTodosAdmins()` em `src/firebase/admin.ts` — getDocs na coleção `admins`
    - Adicionar `adicionarAdmin(uid, email)` — setDoc com email e serverTimestamp
    - Adicionar `removerAdmin(uid)` — deleteDoc
    - _Requirements: 2.2, 3.3, 4.1_

- [x] 2. Atualizar regras de segurança do Firestore
  - [x] 2.1 Expandir regras da coleção admins
    - Permitir `read` para qualquer admin autenticado (não só o próprio)
    - Permitir `create` e `delete` apenas para admins existentes
    - Bloquear `update`
    - Adicionar regra `match /{path=**}/comentarios/{comentarioId}` para collectionGroup queries
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Atualizar documento admin existente
  - [x] 3.1 Adicionar campo email ao documento do admin inicial
    - Atualizar documento `admins/xFRnnrZwvbbvIBjNvkwIi6re8502` para incluir `email`
    - _Requirements: 1.2_

- [x] 4. Atualizar PaginaModeracao com seção de admins
  - [x] 4.1 Adicionar estado e carregamento de admins
    - Adicionar estado `admins`, `novoAdminUid`, `novoAdminEmail`, `isAdicionandoAdmin`
    - Incluir `buscarTodosAdmins()` no `Promise.all` de carregamento (com fallback vazio em caso de erro)
    - _Requirements: 1.1, 1.3_

  - [x] 4.2 Implementar seção de listagem e formulário
    - Seção "Administradores (N)" com lista de admins (email + UID truncado)
    - Formulário com inputs de UID e email + botão "Adicionar Admin"
    - Botão desabilitado quando campos vazios ou durante operação
    - _Requirements: 1.2, 2.1, 2.4_

  - [x] 4.3 Implementar ações de adicionar e remover
    - Handler de adição: chama `adicionarAdmin`, atualiza lista local, limpa campos
    - Handler de remoção: confirmação nativa (`confirm()`), chama `removerAdmin`, atualiza lista
    - Exibir mensagem de erro em caso de falha
    - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3, 4.1_

  - [x] 4.4 Adicionar estilos CSS para a seção de admins
    - `.pagina-moderacao__admin-form` com layout flex e wrap
    - `.pagina-moderacao__admin-input` estilizado com tema escuro
    - `.pagina-moderacao__botao-adicionar-admin` com cor de acento
    - _Requirements: 1.1_

## Notes

- Esta feature foi implementada como extensão da PaginaModeracao existente
- O uid do novo admin deve ser obtido no Firebase Console (Authentication > Users) após o usuário fazer login pela primeira vez
- A remoção usa `confirm()` nativo por simplicidade — pode ser substituído por `ConfirmDialog` em iteração futura
- A listagem de admins usa fallback silencioso para não bloquear o carregamento dos dados de moderação em caso de erro de permissão

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4"] }
  ]
}
```
