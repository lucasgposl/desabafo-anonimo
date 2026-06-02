# Requirements Document

## Introduction

A página Trends exibe os desabafos com mais interações (reações + comentários) nos últimos 30 dias. Ela reutiliza os mesmos componentes e funcionalidades do feed principal (reações, comentários, navegação para a página do desabafo), mas ordena os resultados por popularidade em vez de cronologia. Um link permanente na topbar oferece acesso rápido à página, e um texto explicativo no header contextualiza o conteúdo exibido.

## Glossary

- **Aplicação**: A aplicação web Desabafo Anônimo construída com React e Firebase
- **Usuário_Autenticado**: Pessoa que realizou login na aplicação via Firebase Authentication com provedor Google
- **Visitante**: Pessoa que acessa a aplicação sem estar autenticada
- **PaginaTrends**: Componente de página na rota `/trends` que exibe os desabafos mais populares dos últimos 30 dias
- **Total_Interacoes**: Soma das reações (apoio + forca + pouco) e do campo `totalComentarios` de um desabafo, usada como critério de ordenação
- **Periodo_Trends**: Janela de tempo dos últimos 30 dias corridos a partir da data atual, usada para filtrar os desabafos elegíveis
- **Header_Trends**: Seção textual no topo da PaginaTrends que explica o conteúdo exibido
- **Topbar**: Componente Header da aplicação que contém os links de navegação principal

## Requirements

### Requisito 1: Rota /trends

**User Story:** Como qualquer pessoa, eu quero acessar `/trends` para ver os desabafos mais populares, para que eu possa descobrir os conteúdos que mais movimentaram a plataforma.

#### Critérios de Aceitação

1. THE Aplicação SHALL disponibilizar a rota `/trends` que renderiza a PaginaTrends
2. WHEN qualquer pessoa acessa `/trends`, THE Aplicação SHALL exibir a PaginaTrends com os desabafos dos últimos 30 dias (baseado em `criadoEm`) ordenados por pontuação de popularidade decrescente, onde a pontuação é a soma total de reações (apoio + força + pouco) mais o totalComentarios de cada desabafo
3. THE Aplicação SHALL registrar a rota `/trends` no React Router junto às demais rotas da aplicação
4. IF não existirem desabafos nos últimos 30 dias, THEN THE Aplicação SHALL exibir uma mensagem indicando que não há desabafos em alta no período

### Requisito 2: Link na Topbar

**User Story:** Como qualquer pessoa, eu quero ver um link "Trends" na topbar, para que eu possa navegar facilmente até a página de tendências.

#### Critérios de Aceitação

1. THE Topbar SHALL exibir um link de navegação com o texto "Trends" que direciona para a rota `/trends`
2. THE Topbar SHALL exibir o link "Trends" para todos os visitantes e usuários autenticados, independente de autenticação
3. THE Topbar SHALL posicionar o link "Trends" na área de ações do header, após o link "Feed" e antes do link "Moderação" (quando visível), utilizando o mesmo estilo visual dos demais links de navegação existentes

### Requisito 3: Filtragem por Período de 30 Dias

**User Story:** Como qualquer pessoa, eu quero que a página Trends mostre apenas desabafos recentes, para que o conteúdo exibido reflita o que está em alta agora.

#### Critérios de Aceitação

1. THE PaginaTrends SHALL exibir apenas desabafos cujo campo `criadoEm` esteja dentro dos últimos 30 dias corridos (30 × 24 × 60 × 60 × 1000 milissegundos anteriores ao momento da consulta)
2. THE PaginaTrends SHALL excluir da listagem qualquer desabafo cujo campo `criadoEm` seja anterior ao início do período de 30 dias, sem exibir indicação de que desabafos excluídos existem
3. WHEN nenhum desabafo existir dentro do período de 30 dias, THE PaginaTrends SHALL exibir uma mensagem indicando que não há desabafos em alta no momento, no lugar da listagem
4. IF a consulta ao Firestore falhar ou exceder 10 segundos de tempo de resposta, THEN THE PaginaTrends SHALL exibir uma mensagem de erro indicando falha ao carregar os desabafos em alta e permitir ao usuário tentar novamente

### Requisito 4: Ordenação por Total de Interações

**User Story:** Como qualquer pessoa, eu quero ver os desabafos ordenados por popularidade, para que os mais comentados e reagidos apareçam primeiro.

#### Critérios de Aceitação

1. THE PaginaTrends SHALL calcular o Total_Interacoes de cada desabafo como a soma de `reacoes.apoio + reacoes.forca + reacoes.pouco + totalComentarios`, tratando campos ausentes como 0
2. THE PaginaTrends SHALL ordenar os desabafos em ordem decrescente de Total_Interacoes
3. WHEN dois desabafos possuem o mesmo Total_Interacoes, THE PaginaTrends SHALL exibir primeiro o desabafo com `criadoEm` mais recente
4. WHEN qualquer pessoa reage a um desabafo na PaginaTrends, THE PaginaTrends SHALL manter a posição atual dos desabafos na lista sem reordenar até o próximo carregamento da página

### Requisito 5: Header Explicativo

**User Story:** Como qualquer pessoa, eu quero ver um texto no topo da página Trends explicando o que é exibido, para que eu entenda imediatamente o propósito da página.

#### Critérios de Aceitação

1. THE PaginaTrends SHALL exibir o Header_Trends como primeiro elemento visível da página, posicionado acima da lista de desabafos e de quaisquer controles
2. THE Header_Trends SHALL conter um texto descritivo informando que os desabafos exibidos são os que tiveram mais interações nos últimos 30 dias, renderizado em um elemento de heading acessível (h2 ou equivalente com role adequado)
3. THE Header_Trends SHALL ser totalmente visível no viewport inicial sem necessidade de scroll em dispositivos com largura mínima de 360px
4. WHEN nenhum desabafo existir dentro do Periodo_Trends, THE PaginaTrends SHALL continuar exibindo o Header_Trends normalmente acima da mensagem de lista vazia

### Requisito 6: Funcionalidades do Feed

**User Story:** Como qualquer pessoa, eu quero interagir com os desabafos da página Trends da mesma forma que no feed, para que a experiência seja consistente.

#### Critérios de Aceitação

1. THE PaginaTrends SHALL renderizar a lista de desabafos utilizando o componente Feed, passando os desabafos ordenados por Total_Interacoes
2. THE PaginaTrends SHALL exibir cada desabafo usando o componente DesabafoCard com texto, sentimento, tempo relativo, número e botões de reação
3. THE PaginaTrends SHALL permitir que qualquer pessoa reaja aos desabafos usando os três botões de reação (apoio, força, pouco), limitando a uma reação ativa por usuário por desabafo com atualização otimista
4. THE PaginaTrends SHALL exibir a seção de comentários em cada DesabafoCard com os 5 comentários mais recentes ordenados por data de criação, e um link para ver todos quando o total de comentários ultrapassar 5
5. WHEN qualquer pessoa clica no conteúdo de um DesabafoCard, THE PaginaTrends SHALL navegar para a rota `/desabafo/:numero` do desabafo correspondente
6. WHILE o Visitante não está autenticado, THE PaginaTrends SHALL ocultar o formulário de comentário e exibir mensagem convidando ao login

### Requisito 7: Paginação

**User Story:** Como qualquer pessoa, eu quero carregar mais desabafos na página Trends conforme navego, para que a página carregue de forma rápida e progressiva.

#### Critérios de Aceitação

1. THE PaginaTrends SHALL carregar inicialmente os primeiros 10 desabafos do conjunto já ordenado em ordem decrescente de Total_Interacoes
2. IF existem mais desabafos além dos já exibidos, THEN THE PaginaTrends SHALL exibir um botão "Carregar mais" ao final da lista
3. WHEN qualquer pessoa clica no botão "Carregar mais", THE PaginaTrends SHALL anexar os próximos 10 desabafos ao final da lista existente, mantendo a ordenação decrescente por Total_Interacoes e preservando os itens já exibidos
4. IF todos os desabafos do Periodo_Trends já foram exibidos, THEN THE PaginaTrends SHALL ocultar o botão "Carregar mais"

### Requisito 8: Estado de Carregamento

**User Story:** Como qualquer pessoa, eu quero ver um indicador enquanto os dados carregam, para que eu saiba que a página está funcionando.

#### Critérios de Aceitação

1. WHILE os dados dos desabafos estiverem sendo carregados e nenhum desabafo foi exibido ainda, THE PaginaTrends SHALL exibir um indicador de carregamento composto por uma animação de pulso e um texto descritivo, com um aria-label acessível indicando o estado de carregamento
2. WHEN o carregamento inicial termina e existem desabafos, THE PaginaTrends SHALL substituir o indicador pela lista de desabafos
3. WHILE o carregamento de mais desabafos está em andamento, THE PaginaTrends SHALL exibir um indicador de carregamento inline (animação de pulso sem texto) posicionado abaixo da lista existente de desabafos, com um aria-label acessível indicando o carregamento adicional
4. WHEN o carregamento inicial termina e não existem desabafos, THE PaginaTrends SHALL substituir o indicador por uma mensagem informando que não há desabafos no período selecionado
