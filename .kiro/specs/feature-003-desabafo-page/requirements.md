# Requirements Document

## Introduction

Cada desabafo passa a ter um identificador inteiro incremental (`numero`) gerado no momento da publicação via transação Firestore. A rota `/desabafo/:numero` exibe a página completa do desabafo com texto, sentimento, reações, todos os comentários e formulário de comentário. URLs humano-legíveis substituem os IDs automáticos do Firestore na navegação.

## Glossary

- **Aplicação**: A aplicação web Desabafo Anônimo construída com React e Firebase
- **Usuário_Autenticado**: Pessoa que realizou login na aplicação via Firebase Authentication com provedor Google
- **Visitante**: Pessoa que acessa a aplicação sem estar autenticada
- **Administrador**: Usuário autenticado cujo uid consta na coleção `admins` do Firestore
- **Numero**: Campo inteiro incremental (`numero`) armazenado no documento do desabafo no Firestore, gerado atomicamente via transação no momento da publicação
- **Contador_Global**: Documento `config/counters` no Firestore com o campo `totalDesabafos`, incrementado atomicamente a cada novo desabafo
- **PaginaDesabafo**: Componente de página na rota `/desabafo/:numero` que exibe o desabafo completo
- **DesabafoDoc**: Interface TypeScript que representa a estrutura do documento no Firestore

## Requirements

### Requisito 1: Campo Numero Incremental

**User Story:** Como sistema, eu quero que cada novo desabafo receba um identificador inteiro incremental, para que seja possível endereçá-lo por uma URL amigável.

#### Critérios de Aceitação

1. WHEN um Usuário_Autenticado publica um novo desabafo, THE Aplicação SHALL atribuir ao desabafo um `numero` inteiro único e incremental começando em 1
2. THE Aplicação SHALL gerar o `numero` usando uma transação Firestore que lê e incrementa o campo `totalDesabafos` no documento `config/counters`
3. THE Aplicação SHALL garantir que dois desabafos publicados simultaneamente nunca recebam o mesmo `numero`, pois a transação Firestore é atômica
4. THE Aplicação SHALL armazenar o `numero` como campo do documento do desabafo na coleção `desabafos`
5. IF o documento `config/counters` não existir, THE Aplicação SHALL criá-lo com `totalDesabafos: 1` e atribuir `numero: 1` ao primeiro desabafo

### Requisito 2: Rota /desabafo/:numero

**User Story:** Como qualquer pessoa, eu quero acessar `/desabafo/42` para ver o desabafo de número 42, para que eu possa compartilhar e acessar desabafos específicos por URL.

#### Critérios de Aceitação

1. THE Aplicação SHALL disponibilizar a rota `/desabafo/:numero` que renderiza a `PaginaDesabafo`
2. WHEN qualquer pessoa acessa `/desabafo/:numero`, THE Aplicação SHALL buscar no Firestore o desabafo cujo campo `numero` corresponde ao parâmetro da URL
3. THE Aplicação SHALL usar o campo `numero` (não o ID do documento Firestore) como parâmetro de rota em todas as URLs de navegação

### Requisito 3: Conteúdo da PaginaDesabafo

**User Story:** Como qualquer pessoa, eu quero ver o desabafo completo com todos os comentários em sua própria página, para que eu possa ler e interagir com profundidade.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir na `PaginaDesabafo`: o texto completo do desabafo, o badge de sentimento, o tempo relativo de publicação, os três botões de reação com seus contadores e o número do desabafo
2. THE Aplicação SHALL exibir todos os comentários do desabafo sem limite de quantidade, ordenados do mais antigo para o mais recente
3. THE Aplicação SHALL exibir o formulário de comentário na `PaginaDesabafo` para Usuários_Autenticados
4. WHILE o Visitante não está autenticado, THE Aplicação SHALL exibir os comentários existentes mas ocultar o formulário de comentário, exibindo mensagem convidando ao login
5. WHILE os dados do desabafo estiverem sendo carregados, THE Aplicação SHALL exibir um indicador de carregamento

### Requisito 4: URL com Numero

**User Story:** Como qualquer pessoa, eu quero que a URL do desabafo use o número incremental, para que URLs sejam legíveis e previsíveis.

#### Critérios de Aceitação

1. THE Aplicação SHALL construir URLs de navegação no formato `/desabafo/{numero}` usando o campo `numero` do desabafo
2. THE Aplicação SHALL não expor o ID do documento Firestore (string auto-gerada) em nenhuma URL de navegação da aplicação

### Requisito 5: Página 404 para Numero Inexistente

**User Story:** Como qualquer pessoa, eu quero ver uma mensagem clara quando acesso um número de desabafo que não existe, para que eu entenda que a URL não é válida.

#### Critérios de Aceitação

1. WHEN qualquer pessoa acessa `/desabafo/:numero` e nenhum desabafo com aquele `numero` existe no Firestore, THE Aplicação SHALL exibir uma mensagem informando que o desabafo não foi encontrado
2. THE Aplicação SHALL exibir na página de não encontrado um link de retorno para a página inicial ou para `/feed`
3. IF o parâmetro `:numero` da URL não for um inteiro válido, THE Aplicação SHALL tratar como desabafo não encontrado

### Requisito 6: Contador Global no Firestore

**User Story:** Como sistema, eu quero que o contador de desabafos seja armazenado de forma confiável no Firestore, para que a sequência de números seja consistente mesmo com múltiplos usuários publicando simultaneamente.

#### Critérios de Aceitação

1. THE Aplicação SHALL manter o documento `config/counters` no Firestore com o campo `totalDesabafos` representando o total de desabafos já publicados
2. THE Aplicação SHALL incrementar `totalDesabafos` atomicamente via transação Firestore (`runTransaction`) ao criar cada novo desabafo
3. THE Aplicação SHALL permitir leitura pública do documento `config/counters` (sem autenticação) nas regras de segurança do Firestore
4. THE Aplicação SHALL restringir a escrita no documento `config/counters` apenas a usuários autenticados, via regras de segurança do Firestore

### Requisito 7: Badge de Numero no DesabafoCard

**User Story:** Como qualquer pessoa, eu quero ver o número do desabafo no card do feed, para que eu possa identificar e referir desabafos pelo seu número.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir o campo `numero` como um badge ou label visível em cada `DesabafoCard` no feed
2. THE Aplicação SHALL exibir o badge no formato "#42" ou "nº 42" de forma discreta, sem sobrecarregar visualmente o card
3. IF um desabafo não tiver o campo `numero` (desabafo legado sem migração), THE Aplicação SHALL não exibir o badge e não exibir erro
