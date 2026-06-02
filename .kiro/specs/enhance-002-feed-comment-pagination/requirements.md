# Requirements Document

## Introduction

Refinamento da exibição de comentários no feed e na página do desabafo. No feed, os comentários deixam de ser controlados por um botão toggle de expandir/recolher e passam a ser sempre visíveis com um limite de 5 comentários por card. Quando há mais comentários, um link "ver mais" navega para a página completa do desabafo. O formulário de comentário é exclusivo da `PaginaDesabafo`, não aparecendo nos cards do feed.

## Glossary

- **Aplicação**: A aplicação web Desabafo Anônimo construída com React e Firebase
- **DesabafoCard**: Componente de card exibido no feed que apresenta o texto, reações e comentários de um desabafo
- **ComentarioSection**: Componente responsável por renderizar a lista de comentários e, opcionalmente, o formulário de envio
- **PaginaDesabafo**: Componente de página na rota `/desabafo/:numero` que exibe o desabafo completo com todos os comentários e formulário
- **PaginaFeed**: Componente de página na rota `/feed` que exibe a lista de desabafos
- **PreviewComentarios**: Exibição dos primeiros 5 comentários de um desabafo diretamente no card do feed, sem necessidade de interação do usuário
- **LinkVerMais**: Link textual "ver mais" exibido após a lista de comentários no card do feed quando há mais comentários disponíveis além do limite de 5
- **Usuário_Autenticado**: Pessoa que realizou login na aplicação via Firebase Authentication com provedor Google
- **Visitante**: Pessoa que acessa a aplicação sem estar autenticada

## Requirements

### Requisito 1: Comentários Sempre Visíveis no Card do Feed

**User Story:** Como qualquer pessoa, eu quero ver os comentários mais recentes diretamente no card do desabafo no feed sem precisar clicar em nenhum botão, para que eu tenha uma visão rápida das interações.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir o PreviewComentarios diretamente no DesabafoCard sem exigir interação do usuário para torná-los visíveis
2. THE Aplicação SHALL remover o botão de toggle (expandir/recolher) de comentários do DesabafoCard
3. THE Aplicação SHALL exibir no máximo 5 comentários no PreviewComentarios de cada DesabafoCard no feed
4. WHEN um desabafo possui mais de 0 e até 5 comentários, THE Aplicação SHALL exibir todos os comentários disponíveis no PreviewComentarios
5. WHEN um desabafo possui 0 comentários, THE Aplicação SHALL não renderizar a seção de PreviewComentarios no DesabafoCard

### Requisito 2: Limite de 5 Comentários no Feed via buscarComentarios

**User Story:** Como sistema, eu quero buscar apenas 5 comentários por desabafo no feed, para que a performance de carregamento do feed seja otimizada.

#### Critérios de Aceitação

1. WHEN o DesabafoCard carrega os comentários no feed, THE Aplicação SHALL chamar a função `buscarComentarios` com o parâmetro `limite` igual a 5
2. THE Aplicação SHALL ordenar os comentários exibidos no PreviewComentarios do mais antigo para o mais recente, mantendo a mesma ordenação da PaginaDesabafo

### Requisito 3: Link "Ver Mais" para Navegação

**User Story:** Como qualquer pessoa, eu quero ver um link "ver mais" quando há mais comentários do que os 5 exibidos, para que eu possa navegar à página completa do desabafo e ler todos.

#### Critérios de Aceitação

1. WHEN um desabafo possui mais de 5 comentários (campo `totalComentarios` maior que 5), THE Aplicação SHALL exibir o LinkVerMais após a lista de comentários no DesabafoCard
2. WHEN qualquer pessoa clica no LinkVerMais, THE Aplicação SHALL navegar para a rota `/desabafo/{numero}` correspondente ao desabafo
3. THE Aplicação SHALL exibir o LinkVerMais com o texto "ver mais" de forma discreta abaixo dos comentários
4. WHEN um desabafo possui 5 ou menos comentários, THE Aplicação SHALL não exibir o LinkVerMais

### Requisito 4: Formulário de Comentário Exclusivo da PaginaDesabafo

**User Story:** Como qualquer pessoa, eu quero que o formulário de comentário apareça apenas na página completa do desabafo, para que o feed permaneça limpo e focado na leitura.

#### Critérios de Aceitação

1. THE Aplicação SHALL não renderizar o formulário de comentário (textarea e botão "Comentar") no DesabafoCard exibido no feed
2. THE Aplicação SHALL renderizar o formulário de comentário na PaginaDesabafo para Usuários_Autenticados
3. WHILE o Visitante não está autenticado na PaginaDesabafo, THE Aplicação SHALL exibir mensagem convidando ao login no lugar do formulário de comentário
4. THE Aplicação SHALL parametrizar o ComentarioSection para aceitar uma prop que controla a exibição do formulário de comentário

### Requisito 5: Todos os Comentários na PaginaDesabafo com Scroll Vertical

**User Story:** Como qualquer pessoa, eu quero ver todos os comentários de um desabafo na página completa com scroll vertical, para que eu possa ler todas as interações sem limite.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir todos os comentários do desabafo na PaginaDesabafo sem limite de quantidade
2. WHEN a PaginaDesabafo carrega os comentários, THE Aplicação SHALL chamar a função `buscarComentarios` sem limite restritivo (ou com limite suficientemente alto para retornar todos)
3. THE Aplicação SHALL renderizar a lista de comentários na PaginaDesabafo dentro de um container com scroll vertical quando o conteúdo exceder a altura visível da área de comentários
4. THE Aplicação SHALL ordenar os comentários na PaginaDesabafo do mais antigo para o mais recente

