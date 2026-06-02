# Requirements Document

## Introduction

Criação de uma rota dedicada `/feed` que exibe exclusivamente a lista de desabafos, sem o formulário de publicação. O objetivo é oferecer uma página limpa para navegação e leitura, separando a experiência de publicar da experiência de navegar. A rota `/` permanece inalterada com o formulário e o feed combinados.

## Glossary

- **Aplicação**: A aplicação web Desabafo Anônimo construída com React e Firebase
- **Usuário_Autenticado**: Pessoa que realizou login na aplicação via Firebase Authentication com provedor Google
- **Visitante**: Pessoa que acessa a aplicação sem estar autenticada
- **Administrador**: Usuário autenticado cujo uid consta na coleção `admins` do Firestore
- **PaginaFeed**: Novo componente de página dedicado à rota `/feed`, exibindo somente o feed de desabafos
- **Feed**: Área da interface que exibe a lista de desabafos publicados com filtros e paginação
- **FeedControls**: Componente de filtro por sentimento e contador de desabafos
- **Página_Inicial**: Rota `/`, mantida inalterada com InputBox e feed combinados

## Requirements

### Requisito 1: Rota /feed com Feed Exclusivo

**User Story:** Como qualquer pessoa, eu quero acessar `/feed` para ver apenas os desabafos publicados, sem o formulário de publicação, para que eu possa navegar pelo conteúdo de forma focada.

#### Critérios de Aceitação

1. THE Aplicação SHALL disponibilizar a rota `/feed` que renderiza a `PaginaFeed`
2. THE Aplicação SHALL exibir na `PaginaFeed` apenas o feed de desabafos sem o formulário de publicação (InputBox)
3. WHEN um Visitante ou Usuário_Autenticado acessa `/feed`, THE Aplicação SHALL exibir a lista de desabafos com as mesmas regras de ordenação e filtro da Página_Inicial
4. THE Aplicação SHALL exibir os desabafos na `PaginaFeed` ordenados do mais recente para o mais antigo

### Requisito 2: Cabeçalho da PaginaFeed

**User Story:** Como qualquer pessoa, eu quero ver o cabeçalho da aplicação na página de feed, para que eu tenha acesso ao login e ao link de moderação.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir o componente `Header` na `PaginaFeed` com o título "Desabafo Anônimo"
2. THE Aplicação SHALL exibir o botão de login/logout no `Header` da `PaginaFeed` conforme o estado de autenticação do usuário
3. WHEN o Usuário_Autenticado na `PaginaFeed` é um Administrador, THE Aplicação SHALL exibir o link de acesso à moderação no `Header`

### Requisito 3: Controles de Filtro e Contador

**User Story:** Como qualquer pessoa, eu quero filtrar os desabafos por sentimento na página de feed, para que eu possa encontrar conteúdo que ressoe comigo.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir o componente `FeedControls` na `PaginaFeed` com o seletor de sentimento e o contador de desabafos
2. WHEN o usuário seleciona um sentimento no filtro da `PaginaFeed`, THE Aplicação SHALL exibir apenas os desabafos com o sentimento correspondente e atualizar o contador
3. THE Aplicação SHALL iniciar o filtro com a opção "Todos" selecionada por padrão ao carregar a `PaginaFeed`

### Requisito 4: Paginação

**User Story:** Como qualquer pessoa, eu quero paginar os desabafos na página de feed da mesma forma que na página inicial, para ter uma experiência consistente.

#### Critérios de Aceitação

1. THE Aplicação SHALL carregar inicialmente no máximo 20 desabafos na `PaginaFeed`
2. WHEN há mais desabafos disponíveis, THE Aplicação SHALL exibir um botão "Carregar mais" na `PaginaFeed` que acrescenta os próximos 20 ao final da lista
3. WHEN o filtro é alterado na `PaginaFeed`, THE Aplicação SHALL reiniciar a paginação para a primeira página

### Requisito 5: Navegação para Página do Desabafo

**User Story:** Como qualquer pessoa, eu quero clicar em um card na página de feed para ver os detalhes completos daquele desabafo, para que eu possa ler os comentários e interagir com mais profundidade.

#### Critérios de Aceitação

1. WHEN qualquer pessoa clica em um card de desabafo na `PaginaFeed`, THE Aplicação SHALL navegar para a rota `/desabafo/{numero}` correspondente ao desabafo clicado
2. THE Aplicação SHALL tornar o card clicável visualmente (ex: cursor pointer) indicando que é navegável
3. THE Aplicação SHALL utilizar o campo `numero` do desabafo para compor a URL de destino

### Requisito 6: Página Inicial Inalterada

**User Story:** Como um Usuário_Autenticado, eu quero que a página inicial `/` continue funcionando exatamente como antes, para que eu não perca a capacidade de publicar desabafos.

#### Critérios de Aceitação

1. THE Aplicação SHALL manter a rota `/` com o comportamento atual: exibindo `Header`, `InputBox` (quando autenticado) e o feed
2. THE Aplicação SHALL não remover nem alterar nenhuma funcionalidade existente da rota `/` ao adicionar a rota `/feed`
3. THE Aplicação SHALL manter o link de navegação para `/feed` no `Header` para facilitar o acesso à nova página
