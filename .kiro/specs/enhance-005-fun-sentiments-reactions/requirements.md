# Requirements Document

## Introduction

Este spec define a substituição completa dos sentimentos e reações atuais do app "Desabafo Anônimo" por um conjunto expandido, divertido e com a cara da internet brasileira. O sistema atual tem apenas 3 sentimentos (`triste`, `raiva`, `alivio`) e 3 reações (`apoio`, `forca`, `pouco`), todos hardcoded. O novo sistema terá 15 sentimentos (divididos em "Dramas" e "Good Vibes") e 8 reações, todos configurados via um arquivo de configuração central (source of truth), permitindo adicionar ou remover opções sem alterar lógica de validação.

## Glossary

- **Sistema_Config**: Módulo de configuração centralizada que exporta os objetos `SENTIMENTO_CONFIG` e `REACAO_CONFIG`, servindo como fonte única de verdade para sentimentos e reações disponíveis.
- **Sentimento**: Categoria emocional associada a um desabafo no momento da publicação. Divididos em duas categorias visuais: "Dramas" e "Good Vibes".
- **Reacao**: Tipo de resposta empática que um usuário pode dar a um desabafo existente.
- **SENTIMENTO_CONFIG**: Objeto de configuração que mapeia cada chave de sentimento ao seu label de exibição, emoji e categoria.
- **REACAO_CONFIG**: Objeto de configuração que mapeia cada chave de reação ao seu label de exibição e emoji.
- **Feed**: Página principal que lista os desabafos publicados.
- **InputBox**: Componente de publicação onde o usuário escreve e seleciona o sentimento do desabafo.
- **DesabafoCard**: Componente que exibe um desabafo individual com suas reações.
- **FeedControls**: Componente de filtros que permite filtrar desabafos por sentimento.
- **Firestore_Rules**: Arquivo `firestore.rules` que define as regras de segurança e validação de escrita no Cloud Firestore.

## Requirements

### Requisito 1: Arquivo de configuração centralizado

**User Story:** Como desenvolvedor, eu quero que todos os sentimentos e reações sejam definidos em um único arquivo de configuração, para que eu possa adicionar ou remover opções sem alterar lógica de validação ou componentes.

#### Critérios de Aceitação

1. THE Sistema_Config SHALL exportar um objeto `SENTIMENTO_CONFIG` contendo todas as chaves de sentimentos, onde cada entrada possui as propriedades `label` (string de exibição), `emoji` (caractere emoji único) e `categoria` (valor literal "dramas" ou "good_vibes").
2. THE Sistema_Config SHALL exportar um objeto `REACAO_CONFIG` contendo todas as chaves de reações, onde cada entrada possui as propriedades `label` (string de exibição) e `emoji` (caractere emoji único).
3. THE Sistema_Config SHALL exportar os tipos TypeScript `Sentimento` e `TipoReacao` derivados automaticamente das chaves dos objetos de configuração (usando `keyof typeof`), sem definição manual de union types.
4. WHEN um novo sentimento é adicionado ao `SENTIMENTO_CONFIG`, THE Sistema_Config SHALL torná-lo disponível para seleção no InputBox, filtragem no FeedControls e validação no momento de publicação, sem necessidade de alterações em outros arquivos além do arquivo de configuração.
5. WHEN um novo tipo de reação é adicionado ao `REACAO_CONFIG`, THE Sistema_Config SHALL torná-lo disponível como botão de reação no DesabafoCard e como chave inicializada no campo `reacoes` de novos documentos, sem necessidade de alterações em outros arquivos além do arquivo de configuração.
6. THE Sistema_Config SHALL ser a única fonte de definição de sentimentos e reações no código-fonte; nenhum outro arquivo SHALL conter listas ou union types hardcoded de valores de sentimento ou reação.

### Requisito 2: Novos sentimentos expandidos

**User Story:** Como usuário, eu quero escolher entre sentimentos divertidos e expressivos no estilo da internet brasileira, para que meu desabafo transmita melhor o que estou sentindo.

#### Critérios de Aceitação

1. THE Sistema_Config SHALL definir os seguintes sentimentos na categoria "dramas": `meus_olhos_tao_tremendo` (😤 "Meus olhos tão tremendo"), `surto_controlado` (🤯 "Surto controlado"), `joguei_no_ventilador` (💩 "Joguei no ventilador"), `indiretinha` (🙄 "Indiretinha"), `desaforo` (😠 "Desaforo"), `mimimi_legitimo` (🥲 "Mimimi legítimo"), `to_de_saco_cheio` (😩 "Tô de saco cheio"), `choro_facil` (😭 "Choro fácil"), `foi_pra_conta` (🌋 "Foi pra conta").
2. THE Sistema_Config SHALL definir os seguintes sentimentos na categoria "good_vibes": `good_vibes` (✨ "Good vibes"), `apaixonado` (🥰 "Apaixonado"), `crush` (🫦 "Crush"), `cupido_acertou` (💘 "Cupido acertou"), `final_feliz` (🎉 "Final feliz"), `relaxado` (😎 "Relaxado").
3. THE InputBox SHALL exibir todos os 15 sentimentos agrupados por categoria, onde cada categoria é precedida por um heading visível com o nome da categoria ("Dramas" e "Good Vibes"), e os sentimentos dentro de cada categoria são exibidos na mesma ordem definida no `SENTIMENTO_CONFIG`.
4. THE FeedControls SHALL listar todos os 15 sentimentos disponíveis para filtragem, exibindo o emoji e o label de cada sentimento conforme definido no `SENTIMENTO_CONFIG`.
5. WHEN o usuário seleciona um sentimento no InputBox, THE InputBox SHALL permitir a seleção de apenas um sentimento por vez, desmarcando o sentimento anteriormente selecionado.

### Requisito 3: Novas reações expandidas

**User Story:** Como usuário, eu quero reagir aos desabafos com frases divertidas e empáticas no estilo brasileiro, para que minhas reações sejam mais expressivas e engraçadas.

#### Critérios de Aceitação

1. THE Sistema_Config SHALL definir as seguintes reações: `quem_nunca` (🙋 "Quem nunca"), `nao_julgo` (🤷 "Não julgo"), `se_ja_fiz_nao_me_lembro` (🫣 "Se já fiz não me lembro"), `tomara_que_passe` (🤞 "Tomara que passe"), `eu_ia_pior` (📈 "Eu ia pior"), `respira_fundo` (🧘 "Respira fundo"), `chama_no_particular` (📩 "Chama no particular"), `to_rindo_mas_e_de_nervoso` (😅 "Tô rindo mas é de nervoso").
2. THE DesabafoCard SHALL exibir botões de reação para todas as 8 reações definidas no `REACAO_CONFIG`, na mesma ordem em que aparecem no objeto de configuração.
3. WHEN um usuário clica em uma reação que ainda não selecionou naquele desabafo, THE DesabafoCard SHALL incrementar em 1 o contador da reação selecionada de forma otimista (antes da confirmação do Firestore) e destacar visualmente o botão como ativo.
4. WHEN um usuário clica em uma reação diferente da que já selecionou naquele desabafo, THE DesabafoCard SHALL decrementar em 1 o contador da reação anterior, incrementar em 1 o contador da nova reação, e atualizar o destaque visual para a nova reação.
5. IF um usuário clica na mesma reação que já selecionou naquele desabafo, THEN THE DesabafoCard SHALL ignorar o clique e manter o estado atual sem alterações.
6. IF a persistência da reação no Firestore falhar, THEN THE DesabafoCard SHALL reverter o contador ao valor anterior (rollback) e remover o destaque visual da reação.
7. THE DesabafoCard SHALL exibir o emoji e o label de cada reação conforme definido no `REACAO_CONFIG`.

### Requisito 4: Estrutura de dados flexível no Firestore

**User Story:** Como desenvolvedor, eu quero que a estrutura de reações no Firestore seja flexível o suficiente para suportar qualquer conjunto de reações definido na configuração, para que mudanças futuras não exijam migrações de schema.

#### Critérios de Aceitação

1. WHEN um novo desabafo é criado, THE Sistema SHALL inicializar o campo `reacoes` como um objeto com todas as chaves presentes no `REACAO_CONFIG`, cada uma com valor inteiro zero.
2. THE Sistema SHALL armazenar o campo `sentimento` como uma string correspondente a uma chave válida do `SENTIMENTO_CONFIG`, rejeitando a publicação caso o valor não corresponda a nenhuma chave existente no objeto de configuração.
3. WHEN o `REACAO_CONFIG` é alterado adicionando novas reações, THE Sistema SHALL tratar chaves ausentes em documentos existentes como tendo valor inteiro zero na leitura, sem exigir migração ou atualização dos documentos existentes.
4. THE Sistema SHALL derivar a validação de sentimentos e reações dinamicamente a partir dos objetos de configuração, sem literais de string de chaves de sentimentos ou reações na lógica de validação.
5. IF um documento existente no Firestore contiver chaves de reação que não existem mais no `REACAO_CONFIG` atual, THEN THE Sistema SHALL ignorar essas chaves obsoletas na leitura e exibir apenas as reações presentes no `REACAO_CONFIG` vigente.

### Requisito 5: Tipos TypeScript dinâmicos

**User Story:** Como desenvolvedor, eu quero que os tipos TypeScript de sentimentos e reações sejam derivados automaticamente da configuração, para que haja type-safety sem duplicação de definições.

#### Critérios de Aceitação

1. THE Sistema_Config SHALL exportar o tipo `Sentimento` como union type derivado das chaves do `SENTIMENTO_CONFIG` (usando `keyof typeof SENTIMENTO_CONFIG`).
2. THE Sistema_Config SHALL exportar o tipo `TipoReacao` como union type derivado das chaves do `REACAO_CONFIG` (usando `keyof typeof REACAO_CONFIG`).
3. THE Sistema SHALL declarar o campo `sentimento` nas interfaces `DesabafoDoc`, `Desabafo` e `DesabafoCardProps` usando o tipo `Sentimento` exportado pelo Sistema_Config, e o campo `reacoes` como `Record<TipoReacao, number>` derivado do tipo `TipoReacao`, sem declarar union types literais ou enumerar chaves individualmente nessas interfaces.
4. THE Sistema SHALL declarar o campo `filtroAtivo` na interface `FeedControlsProps` como `Sentimento | 'todos'` usando o tipo `Sentimento` exportado pelo Sistema_Config.
5. WHEN uma chave é removida do `SENTIMENTO_CONFIG` ou `REACAO_CONFIG`, THE compilador TypeScript SHALL reportar erros de compilação em todos os módulos que importam ou utilizam os tipos `Sentimento` ou `TipoReacao` e ainda referenciam a chave removida.
6. IF um módulo do Sistema declara um tipo literal de sentimento ou reação que não é derivado do Sistema_Config, THEN THE compilador TypeScript SHALL não reconhecer esse valor como compatível com os tipos `Sentimento` ou `TipoReacao`.

### Requisito 6: Componente de seleção de sentimento atualizado

**User Story:** Como usuário, eu quero ver os sentimentos organizados visualmente por categoria com emojis, para que a escolha seja rápida e divertida.

#### Critérios de Aceitação

1. THE InputBox SHALL exibir os sentimentos agrupados em duas seções visuais com os títulos "Dramas" e "Good Vibes", derivando o agrupamento da propriedade `categoria` de cada entrada no `SENTIMENTO_CONFIG`.
2. THE InputBox SHALL exibir o emoji e o label de cada sentimento conforme definido no `SENTIMENTO_CONFIG`.
3. WHEN o usuário seleciona um sentimento, THE InputBox SHALL aplicar um estado visual distinto (via atributo `aria-pressed="true"` e classe CSS modificadora ativa) ao sentimento selecionado, diferenciando-o claramente dos não selecionados.
4. THE InputBox SHALL iniciar sem nenhum sentimento pré-selecionado, exigindo que o usuário realize uma seleção ativa antes de permitir a publicação.
5. IF o usuário tenta publicar sem ter selecionado um sentimento, THEN THE InputBox SHALL impedir a publicação e exibir uma mensagem de erro informando que a seleção de sentimento é obrigatória.
6. WHEN o usuário seleciona um sentimento, THE InputBox SHALL desmarcar qualquer sentimento previamente selecionado, permitindo apenas uma seleção ativa por vez.

### Requisito 7: Filtro de sentimentos atualizado

**User Story:** Como usuário, eu quero filtrar o feed por qualquer um dos novos sentimentos, para que eu encontre desabafos do tipo que me interessa.

#### Critérios de Aceitação

1. THE FeedControls SHALL listar todas as opções de sentimento derivadas do `SENTIMENTO_CONFIG`, agrupadas por categoria ("Dramas" e "Good Vibes") utilizando rótulos de grupo visíveis no seletor.
2. THE FeedControls SHALL incluir a opção "Todos" como primeira opção do filtro, selecionada por padrão ao carregar a página.
3. WHEN o usuário seleciona um sentimento no filtro, THE Feed SHALL exibir apenas desabafos que possuem o sentimento selecionado.
4. WHEN o usuário seleciona a opção "Todos" no filtro, THE Feed SHALL exibir desabafos de todos os sentimentos sem distinção.
5. THE FeedControls SHALL exibir o emoji ao lado do nome de cada sentimento no seletor de filtro, conforme definido no `SENTIMENTO_CONFIG`.
6. IF o filtro selecionado não retornar nenhum desabafo, THEN THE Feed SHALL exibir uma mensagem indicando que não há desabafos para o sentimento escolhido.

### Requisito 8: Firestore rules sem valores hardcoded

**User Story:** Como desenvolvedor, eu quero que as Firestore Security Rules não contenham listas hardcoded de sentimentos ou reações, para que a adição de novos valores na configuração não exija redeploy das rules.

#### Critérios de Aceitação

1. THE Firestore_Rules SHALL validar o campo `sentimento` como uma string com comprimento entre 1 e 100 caracteres, sem listar valores permitidos (a validação semântica é responsabilidade do client).
2. THE Firestore_Rules SHALL validar o campo `reacoes` como um map presente no documento, sem listar chaves específicas, e na criação do documento todos os valores dentro do map devem ser inteiros iguais a zero.
3. WHEN um novo sentimento ou reação é adicionado ao config, THE Firestore_Rules SHALL aceitar o novo valor sem necessidade de atualização ou redeploy.
4. THE Firestore_Rules SHALL manter as validações existentes de autenticação (`request.auth != null`), tamanho de texto (entre 1 e 2000 caracteres), propriedade do `uid` (`request.auth.uid`), e imutabilidade dos campos `texto`, `sentimento`, `criadoEm` e `uid` na atualização.
5. IF um campo dentro do map `reacoes` é atualizado, THEN THE Firestore_Rules SHALL aceitar apenas valores inteiros maiores ou iguais a zero.

### Requisito 9: Remoção completa dos valores antigos

**User Story:** Como desenvolvedor, eu quero que os valores antigos de sentimentos e reações sejam completamente removidos do código-fonte, para que não haja referências obsoletas no sistema.

#### Critérios de Aceitação

1. THE Sistema SHALL remover os tipos literais antigos (`'triste' | 'raiva' | 'alivio'` e `'apoio' | 'forca' | 'pouco'`) do arquivo `src/types/index.ts`.
2. THE Sistema SHALL remover todas as referências hardcoded aos valores antigos em componentes, hooks e funções utilitárias.
3. THE Sistema SHALL substituir o mapeamento de cores por sentimento (`obterCorSentimento`) por uma lógica que derive cores da categoria do sentimento (uma cor para "dramas", outra cor para "good_vibes").
4. IF um documento existente no Firestore contiver um sentimento antigo (`triste`, `raiva`, `alivio`), THEN THE Sistema SHALL exibi-lo com o label "Sentimento antigo" e um emoji genérico (❓) sem causar erro de renderização.
5. IF um documento existente no Firestore contiver chaves de reação antigas (`apoio`, `forca`, `pouco`), THEN THE Sistema SHALL ignorar essas chaves na exibição e não incluir contadores para reações que não existem no `REACAO_CONFIG` vigente.
6. THE Sistema SHALL não incluir tratamento de sentimentos ou reações antigos nos testes de unidade, dado que são valores legados apenas no Firestore.
