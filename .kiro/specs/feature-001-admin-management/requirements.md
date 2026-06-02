# Requirements Document

## Introduction

Extensão da aplicação Desabafo Anônimo para permitir que administradores existentes gerenciem outros administradores diretamente pela interface da aplicação, sem necessidade de acesso manual ao console do Firebase. A funcionalidade está acessível exclusivamente na Página de Moderação e permite adicionar e remover administradores informando o UID e email do usuário.

## Glossary

- **Administrador**: Usuário autenticado cujo uid consta na coleção `admins` do Firestore
- **Coleção_Admins**: Coleção no Firestore que armazena documentos com `uid` (ID do documento), `email` e `criadoEm`
- **Página_Moderação**: Rota `/moderacao`, acessível apenas por administradores autenticados
- **UID**: Identificador único do usuário no Firebase Authentication

## Requirements

### Requisito 1: Listar Administradores

**User Story:** Como um Administrador, eu quero ver a lista de administradores cadastrados, para que eu saiba quem tem acesso à moderação.

#### Critérios de Aceitação

1. WHEN um Administrador acessa a Página_Moderação, THE Aplicação SHALL exibir uma seção "Administradores" com a lista de todos os admins cadastrados
2. THE Aplicação SHALL exibir para cada admin o email e os primeiros 12 caracteres do UID
3. IF a lista de admins não puder ser carregada, THE Aplicação SHALL exibir a seção vazia sem bloquear o carregamento dos demais dados de moderação

### Requisito 2: Adicionar Administrador

**User Story:** Como um Administrador, eu quero adicionar novos administradores informando o UID e email, para que eu possa delegar acesso de moderação sem usar o console do Firebase.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir um formulário com dois campos: "UID do novo admin" e "Email do novo admin"
2. WHEN o Administrador preenche ambos os campos e clica em "Adicionar Admin", THE Aplicação SHALL criar um documento na coleção `admins` com o uid como ID do documento, o email informado e a data de criação
3. WHEN o admin é adicionado com sucesso, THE Aplicação SHALL inserir o novo admin na lista sem recarregar a página e limpar os campos do formulário
4. IF algum dos campos estiver vazio, THEN THE Aplicação SHALL manter o botão "Adicionar Admin" desabilitado
5. IF ocorrer um erro ao adicionar o admin, THEN THE Aplicação SHALL exibir uma mensagem de erro na página

### Requisito 3: Remover Administrador

**User Story:** Como um Administrador, eu quero remover outros administradores, para que eu possa revogar acessos de moderação quando necessário.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir um botão "Remover" ao lado de cada admin na lista
2. WHEN o Administrador clica em "Remover", THE Aplicação SHALL exibir uma confirmação nativa antes de executar a remoção
3. WHEN a remoção é confirmada, THE Aplicação SHALL deletar o documento da coleção `admins` e remover o admin da lista sem recarregar a página
4. IF ocorrer um erro ao remover, THEN THE Aplicação SHALL exibir uma mensagem de erro

### Requisito 4: Controle de Acesso

**User Story:** Como sistema, eu quero garantir que apenas admins existentes possam gerenciar outros admins, para que o acesso à moderação não seja escalável por usuários não autorizados.

#### Critérios de Aceitação

1. THE Aplicação SHALL utilizar as regras de segurança do Firestore para garantir que apenas documentos com `request.auth.uid` presente na coleção `admins` possam criar ou deletar documentos nessa coleção
2. THE Aplicação SHALL permitir que admins leiam todos os documentos da coleção `admins` para exibir a lista completa
3. THE Aplicação SHALL bloquear atualização de documentos da coleção `admins` via cliente
