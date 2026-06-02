# Requirements Document

## Introduction

Melhoria da Página de Moderação para: (1) agrupar os comentários sob o desabafo ao qual pertencem, em vez de exibi-los em lista plana separada; (2) paginar a lista de desabafos para suportar volumes grandes; (3) permitir busca por número incremental do desabafo. Cada desabafo passa a ter uma linha expansível com comentários inline e carregamento sob demanda. A seção independente de "Comentários" é removida.

## Glossary

- **Administrador**: Usuário autenticado cujo uid consta na coleção `admins` do Firestore
- **Página_Moderação**: Rota `/moderacao`, acessível apenas por administradores autenticados
- **Desabafo_Row**: Linha na lista de desabafos da Página_Moderação representando um único desabafo
- **Comentários_Inline**: Comentários de um desabafo exibidos diretamente abaixo de sua Desabafo_Row quando expandida
- **Badge_Comentários**: Indicador numérico exibido na Desabafo_Row mostrando a quantidade total de comentários do desabafo
- **Lazy_Load**: Estratégia de carregamento em que os comentários só são buscados no Firestore no momento em que o Administrador expande a linha correspondente
- **Numero**: Campo inteiro incremental do desabafo, definido pela feature `feature-003-desabafo-page`
- **Pagina_Desabafos**: Subconjunto de 25 desabafos carregados por vez na lista de moderação, navegável via cursor

## Requirements

### Requisito 1: Linha Expansível na Lista de Desabafos

**User Story:** Como um Administrador, eu quero expandir e recolher os comentários de cada desabafo diretamente na sua linha, para que eu possa revisar o contexto completo sem sair da lista.

#### Critérios de Aceitação

1. WHEN um Administrador acessa a Página_Moderação, THE Aplicação SHALL exibir cada desabafo como uma Desabafo_Row com um botão de alternância (toggle) para expandir ou recolher os comentários
2. WHEN o Administrador clica no toggle de uma Desabafo_Row recolhida, THE Aplicação SHALL expandir a linha e exibir os Comentários_Inline abaixo do desabafo
3. WHEN o Administrador clica no toggle de uma Desabafo_Row expandida, THE Aplicação SHALL recolher a linha e ocultar os Comentários_Inline sem perder os dados já carregados
4. THE Aplicação SHALL permitir que múltiplas Desabafo_Rows estejam expandidas simultaneamente
5. THE Aplicação SHALL exibir o Badge_Comentários com o valor de `totalComentarios` do desabafo no toggle, no formato "N comentário" quando N for 1 ou "N comentários" quando N for 0 ou maior que 1

### Requisito 2: Carregamento Sob Demanda dos Comentários

**User Story:** Como um Administrador, eu quero que os comentários sejam carregados apenas quando expando o desabafo, para que a página não faça requisições desnecessárias ao Firestore.

#### Critérios de Aceitação

1. WHEN a Página_Moderação é carregada, THE Aplicação SHALL buscar apenas os desabafos — sem buscar comentários de nenhum desabafo ainda
2. WHEN o Administrador expande uma Desabafo_Row pela primeira vez, THE Aplicação SHALL buscar os comentários daquele desabafo usando a função `buscarComentarios` existente
3. WHEN os comentários de uma Desabafo_Row já foram carregados, THE Aplicação SHALL reutilizar os dados em memória ao reexpandir a linha sem fazer nova requisição ao Firestore
4. WHILE os comentários de um desabafo estiverem sendo carregados, THE Aplicação SHALL exibir um indicador de carregamento dentro da Desabafo_Row expandida
5. IF ocorrer uma falha ao carregar os comentários de um desabafo, THEN THE Aplicação SHALL exibir uma mensagem de erro dentro da Desabafo_Row e manter o toggle visível para nova tentativa

### Requisito 3: Remoção de Comentários Inline

**User Story:** Como um Administrador, eu quero remover comentários diretamente da linha expandida do desabafo, para que eu possa moderar sem precisar navegar para outra seção.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir um botão de remoção individual ao lado de cada comentário exibido nos Comentários_Inline
2. WHEN o Administrador clica no botão de remoção de um comentário inline, THE Aplicação SHALL exibir um diálogo de confirmação antes de executar a remoção
3. WHEN o Administrador confirma a remoção de um comentário inline, THE Aplicação SHALL remover o comentário do Firestore, retirá-lo da lista inline e decrementar o Badge_Comentários da Desabafo_Row correspondente
4. IF ocorrer uma falha ao remover um comentário inline, THEN THE Aplicação SHALL exibir uma mensagem de erro e manter o comentário visível na lista

### Requisito 4: Remoção da Seção Plana de Comentários

**User Story:** Como um Administrador, eu quero que a lista separada de comentários desapareça da página, para que o layout fique mais organizado e sem duplicação de informação.

#### Critérios de Aceitação

1. THE Aplicação SHALL não exibir uma seção independente de comentários na Página_Moderação
2. THE Aplicação SHALL não buscar todos os comentários de todos os desabafos de forma antecipada durante o carregamento inicial da página
3. WHEN um desabafo não tem comentários (totalComentarios === 0), THE Aplicação SHALL exibir o Badge_Comentários com valor 0 e desabilitar ou ocultar o toggle de expansão

### Requisito 6: Paginação da Lista de Desabafos

**User Story:** Como um Administrador, eu quero que a lista de desabafos seja paginada, para que a página de moderação funcione bem mesmo com centenas ou milhares de desabafos.

#### Critérios de Aceitação

1. THE Aplicação SHALL carregar no máximo 25 desabafos por vez na lista de moderação, ordenados do mais recente para o mais antigo
2. WHEN existirem mais desabafos além dos 25 carregados, THE Aplicação SHALL exibir um botão "Carregar mais" ao final da lista
3. WHEN o Administrador clica em "Carregar mais", THE Aplicação SHALL acrescentar os próximos 25 desabafos ao final da lista já exibida sem remover os anteriores, usando cursor de paginação (`startAfter`)
4. WHILE a próxima página de desabafos estiver sendo carregada, THE Aplicação SHALL desabilitar o botão "Carregar mais" e exibir indicador de carregamento
5. WHEN não existirem mais desabafos a carregar, THE Aplicação SHALL ocultar o botão "Carregar mais"
6. WHEN a busca por número está ativa, THE Aplicação SHALL desabilitar a paginação e exibir apenas o resultado da busca

### Requisito 7: Busca de Desabafo por Número

**User Story:** Como um Administrador, eu quero buscar um desabafo pelo seu número incremental, para que eu possa localizar rapidamente um desabafo específico reportado por usuários.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir um campo de busca na Página_Moderação para filtrar desabafos pelo campo `numero`
2. WHEN o Administrador digita um número inteiro válido no campo de busca e confirma (Enter ou botão), THE Aplicação SHALL buscar o desabafo com aquele `numero` exato no Firestore e exibir apenas ele na lista
3. WHEN a busca retorna resultado, THE Aplicação SHALL exibir o desabafo encontrado com a mesma Desabafo_Row expansível da lista normal
4. WHEN a busca não retorna resultado, THE Aplicação SHALL exibir uma mensagem "Nenhum desabafo encontrado com o número informado"
5. WHEN o Administrador limpa o campo de busca ou clica em "Limpar", THE Aplicação SHALL restaurar a lista paginada normal
6. THE Aplicação SHALL desabilitar o campo de busca por número enquanto o campo `numero` não estiver disponível (anterior à implementação da `feature-003-desabafo-page`); neste estado o campo pode ser exibido como placeholder indicando dependência futura
7. IF o valor digitado no campo de busca não for um inteiro positivo válido, THEN THE Aplicação SHALL não realizar a busca e exibir uma mensagem de validação

### Requisito 5: Badge de Contagem de Comentários

**User Story:** Como um Administrador, eu quero ver a contagem de comentários de cada desabafo diretamente na sua linha, para que eu saiba quais desabafos têm mais atividade sem precisar expandir todos.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir o Badge_Comentários em cada Desabafo_Row usando o campo `totalComentarios` já disponível no objeto `Desabafo`
2. THE Aplicação SHALL atualizar o Badge_Comentários imediatamente após a remoção de um comentário inline, decrementando o valor exibido
3. THE Aplicação SHALL exibir o badge com destaque visual diferente de zero (ex: cor de acento) quando o desabafo tiver comentários, e neutro quando estiver vazio
