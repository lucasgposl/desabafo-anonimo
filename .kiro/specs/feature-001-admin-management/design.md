# Design Document

## Overview

Extensão da `PaginaModeracao` para incluir gestão de administradores. A feature adiciona uma nova seção na página existente sem alterar a arquitetura — reutiliza o serviço `src/firebase/admin.ts` com três novas funções e expande o componente `PaginaModeracao` com estado e UI para listar, adicionar e remover admins.

## Architecture

Sem novas camadas. A feature se encaixa nas camadas existentes:

| Camada | Mudança |
|--------|---------|
| Firestore | Regras atualizadas para permitir que admins leiam/criem/deletem na coleção `admins` |
| Serviço (`firebase/admin.ts`) | +3 funções: `buscarTodosAdmins`, `adicionarAdmin`, `removerAdmin` |
| Componente (`PaginaModeracao.tsx`) | Nova seção com lista, formulário e botões de remoção |

## Data Model

Documento existente na coleção `admins` — atualizado para incluir `email`:

```typescript
// Firestore: admins/{uid}
interface AdminDoc {
  email: string;      // Email do administrador (novo campo)
  criadoEm: Timestamp;
}

// Modelo React para exibição
interface AdminInfo {
  uid: string;        // ID do documento (= uid do Firebase Auth)
  email: string;
  criadoEm: Date;
}
```

## Service API

```typescript
// src/firebase/admin.ts

// Lista todos os admins (requer auth + isAdmin no Firestore)
async function buscarTodosAdmins(): Promise<AdminInfo[]>

// Cria documento em admins/{uid} com email e criadoEm
async function adicionarAdmin(uid: string, email: string): Promise<void>

// Deleta documento admins/{uid}
async function removerAdmin(uid: string): Promise<void>
```

## Security Rules

```javascript
match /admins/{adminId} {
  // Leitura: próprio admin ou qualquer admin listando todos
  allow read: if isAuthenticated() && (request.auth.uid == adminId || isAdmin());
  // Criação/exclusão: apenas admins existentes
  allow create: if isAdmin();
  allow delete: if isAdmin();
  allow update: if false;
}
```

## UI — Seção de Admins na PaginaModeracao

```
┌─────────────────────────────────────────┐
│ Administradores (2)                     │
├─────────────────────────────────────────┤
│ [input: UID] [input: Email] [Adicionar] │
├─────────────────────────────────────────┤
│ thiago@ifal.edu.br  UID: xFRnnrZwvb...  [Remover] │
│ outro@email.com     UID: abc123def4...  [Remover] │
└─────────────────────────────────────────┘
```

## Correctness Properties

### Property 1: Apenas admins podem gerenciar admins
Para qualquer operação de criação ou remoção na coleção `admins`, o Firestore deve rejeitar a operação se `request.auth.uid` não constar na coleção `admins`.

### Property 2: Adição persiste os campos corretos
Para qualquer uid e email fornecidos, o documento criado deve ter exatamente o uid como ID do documento, o email informado e um timestamp válido em `criadoEm`.
