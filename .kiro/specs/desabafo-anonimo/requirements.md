# Requirements Document

## Introduction

O Desabafo Anônimo é uma aplicação web que permite que pessoas expressem seus sentimentos de forma anônima para os demais leitores, utilizando autenticação via Google (Firebase Authentication) para controle interno. A aplicação utiliza React e Firebase para criar um ambiente digital acolhedor onde qualquer pessoa autenticada pode desabafar sem julgamentos e encontrar identificação em outras experiências. O anonimato é garantido na visualização: nenhum leitor do feed consegue identificar quem escreveu um desabafo, porém internamente o sistema associa cada desabafo ao usuário autenticado. Visitantes não autenticados podem visualizar o feed e reagir, mas não podem publicar desabafos ou comentários. Administradores possuem acesso a funcionalidades de moderação para remoção de conteúdo inadequado.

## Glossary

- **Aplicação**: A aplicação web Desabafo Anônimo construída com React e Firebase
- **Usuário_Autenticado**: Pessoa que realizou login na aplicação via Firebase Authentication com provedor Google
- **Visitante**: Pessoa que acessa a aplicação sem estar autenticada
- **Administrador**: Usuário autenticado cujo identificador consta na coleção "admins" do Firestore
- **Desabafo**: Texto escrito pelo usuário autenticado expressando seus sentimentos
- **Comentário**: Texto escrito por um usuário autenticado em resposta a um desabafo existente
- **Sentimento**: Categoria emocional associada a um desabafo (Tristeza, Raiva ou Alívio)
- **Feed**: Área da interface que exibe a lista de desabafos publicados
- **Card**: Componente visual que representa um desabafo individual no feed
- **Reação**: Interação de qualquer pessoa (autenticada ou não) com um desabafo existente (Eu me identifiquei, Força, Eu acho é pouco)
- **Firebase**: Plataforma de backend utilizada para persistência, autenticação e hospedagem
- **Firebase_Authentication**: Serviço do Firebase utilizado para autenticação de usuários via provedor Google
- **Firestore**: Banco de dados NoSQL do Firebase utilizado para armazenar desabafos, comentários e dados de administradores
- **Coleção_Admins**: Coleção no Firestore que armazena os identificadores dos usuários administradores
- **Página_Moderação**: Interface acessível apenas por administradores para gerenciar conteúdo da aplicação
- **Contador**: Elemento visual que exibe a quantidade total de desabafos no feed
- **Filtro**: Controle que permite ao usuário visualizar desabafos por sentimento específico
- **Texto_Válido**: Texto não vazio e que não contém apenas espaços em branco, com no máximo 2000 caracteres
- **Comentário_Válido**: Texto não vazio e que não contém apenas espaços em branco, com no máximo 500 caracteres

## Requirements

### Requisito 1: Publicação de Desabafo

**User Story:** Como um Usuário_Autenticado, eu quero escrever e publicar um desabafo anonimamente para os leitores, para que eu possa expressar meus sentimentos sem ser identificado publicamente.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir um campo de texto multilinha com texto placeholder não vazio convidando o usuário a escrever sobre seus sentimentos
2. THE Aplicação SHALL exibir um seletor de sentimento com as opções Tristeza, Raiva e Alívio, com "Tristeza" selecionado por padrão
3. WHEN o Usuário_Autenticado clica no botão "Publicar" com Texto_Válido, THE Aplicação SHALL criar um novo desabafo com o texto, sentimento selecionado, data atual e identificador do Usuário_Autenticado
4. WHEN o Usuário_Autenticado clica no botão "Publicar" com Texto_Válido, THE Aplicação SHALL persistir o desabafo no Firestore associando o identificador do Usuário_Autenticado ao documento
5. WHEN o desabafo é publicado com sucesso, THE Aplicação SHALL limpar o campo de texto e restaurar o sentimento para o valor padrão
6. WHEN o desabafo é publicado com sucesso, THE Aplicação SHALL exibir uma mensagem temporária de confirmação indicando que o desabafo foi publicado, visível por 3 segundos
7. IF o Usuário_Autenticado tenta publicar com o campo de texto vazio ou contendo apenas espaços, THEN THE Aplicação SHALL exibir um alerta informando que é necessário escrever algo
8. IF o texto exceder 2000 caracteres, THEN THE Aplicação SHALL impedir a publicação e informar o limite de caracteres
9. IF ocorrer uma falha ao persistir o desabafo no Firestore, THEN THE Aplicação SHALL exibir uma mensagem de erro indicando falha na publicação, manter o texto no campo para nova tentativa e reabilitar o botão "Publicar"
10. IF um Visitante tenta publicar um desabafo, THEN THE Aplicação SHALL exibir uma mensagem solicitando que o Visitante faça login antes de publicar
11. WHILE a persistência do desabafo no Firestore estiver em andamento, THE Aplicação SHALL desabilitar o botão "Publicar" e exibir um indicador de carregamento para evitar submissões duplicadas

### Requisito 2: Feed de Desabafos

**User Story:** Como qualquer pessoa (Visitante ou Usuário_Autenticado), eu quero visualizar os desabafos publicados em um feed, para que eu possa ler experiências de outras pessoas e me sentir acolhido.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir os desabafos no feed ordenados do mais recente para o mais antigo com base na data de publicação
2. THE Aplicação SHALL renderizar cada desabafo como um card contendo o texto do desabafo, o sentimento associado, o tempo relativo da publicação e os três botões de reação ("Eu me identifiquei", "Força", "Eu acho é pouco")
3. WHEN um novo desabafo é publicado pelo Usuário_Autenticado na mesma sessão, THE Aplicação SHALL inserir o novo desabafo no topo do feed sem recarregar a página
4. THE Aplicação SHALL exibir o contador com a quantidade total de desabafos disponíveis (incluindo os ainda não carregados na interface) no formato "{número} desabafo" quando houver exatamente 1 desabafo, ou "{número} desabafos" quando houver 0 ou mais de 1
5. THE Aplicação SHALL carregar inicialmente no máximo 20 desabafos e, quando houver mais desabafos disponíveis, exibir um botão "Carregar mais" que ao ser clicado acrescenta os próximos 20 desabafos ao final da lista já exibida sem remover os anteriores
6. IF não existirem desabafos publicados, THEN THE Aplicação SHALL exibir uma mensagem indicando que o feed está vazio
7. THE Aplicação SHALL não exibir informações que identifiquem o autor do desabafo no feed (nome, email ou foto)

### Requisito 3: Filtro por Sentimento

**User Story:** Como qualquer pessoa, eu quero filtrar os desabafos por sentimento, para que eu possa encontrar experiências semelhantes às minhas.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir um seletor de filtro com as opções "Todos", "Tristeza", "Raiva" e "Alívio", com a opção "Todos" selecionada por padrão ao carregar a página
2. WHEN o usuário seleciona um sentimento no filtro, THE Aplicação SHALL exibir apenas os desabafos com o sentimento correspondente, mantendo a ordenação do mais recente para o mais antigo e reiniciando a paginação para a primeira página
3. WHEN o usuário seleciona "Todos" no filtro, THE Aplicação SHALL exibir todos os desabafos independentemente do sentimento
4. WHEN o filtro é alterado, THE Aplicação SHALL atualizar o contador para refletir a quantidade de desabafos visíveis no filtro ativo
5. IF o filtro selecionado não retorna nenhum desabafo, THEN THE Aplicação SHALL exibir uma mensagem indicando que não há desabafos para o sentimento escolhido

### Requisito 4: Reações aos Desabafos

**User Story:** Como qualquer pessoa (Visitante ou Usuário_Autenticado), eu quero reagir aos desabafos de outras pessoas, para que eu possa demonstrar empatia e apoio.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir três botões de reação em cada card: "Eu me identifiquei", "Força" e "Eu acho é pouco"
2. THE Aplicação SHALL exibir o contador de cliques ao lado de cada botão de reação como número inteiro, iniciando em 0 para desabafos sem reações
3. WHEN qualquer pessoa (Visitante ou Usuário_Autenticado) clica em um botão de reação, THE Aplicação SHALL incrementar o contador correspondente em 1 na interface de forma otimista (antes de aguardar a resposta do Firestore) e manter o botão habilitado para novos cliques
4. WHEN qualquer pessoa clica em um botão de reação, THE Aplicação SHALL persistir o incremento do contador no Firestore de forma atômica
5. THE Aplicação SHALL permitir que a mesma pessoa reaja múltiplas vezes ao mesmo desabafo, incrementando o contador a cada clique individual
6. IF ocorrer uma falha ao persistir a reação no Firestore, THEN THE Aplicação SHALL reverter o incremento do contador na interface ao valor anterior e exibir uma mensagem informando o usuário sobre o erro por 3 segundos

### Requisito 5: Anonimato na Visualização

**User Story:** Como um Usuário_Autenticado, eu quero que minha identidade não seja exibida publicamente nos desabafos, para que eu me sinta seguro ao expressar meus sentimentos.

#### Critérios de Aceitação

1. THE Aplicação SHALL não exibir nome, email, foto ou qualquer informação identificável do autor em desabafos no feed, incluindo não transmitir o identificador do Usuário_Autenticado nos dados carregados pelo cliente para exibição no feed
2. THE Aplicação SHALL não exibir nome, email, foto ou qualquer informação identificável do autor em comentários no feed, incluindo não transmitir o identificador do Usuário_Autenticado nos dados de comentários carregados pelo cliente para exibição no feed
3. THE Aplicação SHALL armazenar o identificador do Usuário_Autenticado associado ao desabafo no Firestore exclusivamente para fins de moderação e controle interno, garantindo que as regras de segurança do Firestore restrinjam a leitura deste campo apenas a Administradores
4. THE Aplicação SHALL utilizar o identificador de documento gerado automaticamente pelo Firestore como identificador único de cada desabafo, sem gerar identificadores que permitam correlacionar múltiplos desabafos ao mesmo autor
5. THE Aplicação SHALL não permitir que Visitantes ou Usuários_Autenticados consultem a autoria de desabafos ou comentários através da interface da aplicação nem através dos dados retornados pelas consultas ao Firestore acessíveis ao cliente

### Requisito 6: Persistência com Firebase

**User Story:** Como um usuário, eu quero que os desabafos sejam persistidos na nuvem, para que todas as pessoas possam visualizar os desabafos publicados.

#### Critérios de Aceitação

1. THE Aplicação SHALL armazenar cada desabafo no Firestore contendo texto, sentimento, data de criação, contadores de reações e identificador do Usuário_Autenticado autor
2. WHEN a página é carregada, THE Aplicação SHALL buscar os desabafos existentes no Firestore e exibi-los no feed ordenados do mais recente para o mais antigo
3. WHILE a busca dos desabafos no Firestore estiver em andamento, THE Aplicação SHALL exibir um indicador de carregamento no feed e ocultar o conteúdo do feed
4. IF ocorrer uma falha na comunicação com o Firestore, THEN THE Aplicação SHALL ocultar o indicador de carregamento, exibir uma mensagem informando o usuário sobre o problema de conexão e exibir um botão para tentar novamente
5. IF a busca dos desabafos no Firestore não retornar resposta em 10 segundos, THEN THE Aplicação SHALL tratar como falha de comunicação conforme o critério 4
6. WHEN o usuário clica no botão de tentar novamente após uma falha de comunicação, THE Aplicação SHALL reiniciar a busca dos desabafos desde o início, exibindo novamente o indicador de carregamento

### Requisito 7: Moderação e Administração

**User Story:** Como um Administrador, eu quero poder remover desabafos e comentários inadequados, para que eu possa manter o ambiente da aplicação acolhedor e seguro.

#### Critérios de Aceitação

1. THE Aplicação SHALL manter uma Coleção_Admins no Firestore contendo os identificadores dos Usuários_Autenticados que possuem permissão de administração
2. WHEN um Usuário_Autenticado cujo identificador consta na Coleção_Admins acessa a aplicação, THE Aplicação SHALL exibir um link de acesso à Página_Moderação
3. WHEN um Administrador acessa a Página_Moderação, THE Aplicação SHALL exibir a lista de todos os desabafos contendo para cada item um trecho do texto (até 100 caracteres), o sentimento, a data de publicação e um botão de remoção individual
4. WHEN um Administrador acessa a Página_Moderação, THE Aplicação SHALL exibir a lista de todos os comentários contendo para cada item um trecho do texto (até 100 caracteres), a data de publicação e um botão de remoção individual
5. WHEN um Administrador clica no botão de remoção de um desabafo, THE Aplicação SHALL exibir um diálogo de confirmação com opções de confirmar e cancelar antes de executar a remoção
6. WHEN um Administrador confirma a remoção de um desabafo, THE Aplicação SHALL remover o desabafo e todos os comentários associados do Firestore e atualizar a lista na Página_Moderação sem recarregar a página
7. WHEN um Administrador clica no botão de remoção de um comentário, THE Aplicação SHALL exibir um diálogo de confirmação com opções de confirmar e cancelar antes de executar a remoção
8. WHEN um Administrador confirma a remoção de um comentário, THE Aplicação SHALL remover o comentário do Firestore e atualizar a lista na Página_Moderação sem recarregar a página
9. IF um Usuário_Autenticado que não consta na Coleção_Admins tenta acessar a Página_Moderação, THEN THE Aplicação SHALL redirecionar para o feed e exibir uma mensagem de acesso negado
10. IF um Visitante tenta acessar a Página_Moderação, THEN THE Aplicação SHALL redirecionar para o feed e exibir uma mensagem solicitando login
11. WHEN um Administrador clica em "Apagar tudo" na Página_Moderação, THE Aplicação SHALL exibir um diálogo de confirmação com opções de confirmar e cancelar antes de executar a remoção em massa
12. WHEN um Administrador confirma a ação "Apagar tudo", THE Aplicação SHALL remover todos os desabafos e comentários do Firestore e atualizar a Página_Moderação para exibir as listas vazias sem recarregar a página
13. IF ocorrer uma falha ao remover um desabafo, comentário ou ao executar a remoção em massa no Firestore, THEN THE Aplicação SHALL exibir uma mensagem informando o Administrador sobre o erro e manter os itens não removidos visíveis na lista

### Requisito 8: Interface Acolhedora

**User Story:** Como um usuário, eu quero uma interface visualmente acolhedora, para que eu me sinta confortável ao usar a aplicação.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir um cabeçalho com o título "Desabafo Anônimo" e um aviso informando que o site não substitui ajuda profissional
2. THE Aplicação SHALL aplicar uma borda lateral com cor distinta em cada card de acordo com o sentimento selecionado, de forma que cada sentimento (Tristeza, Raiva, Alívio) possua uma cor visualmente diferenciável das demais
3. THE Aplicação SHALL exibir o tempo relativo da publicação em cada card conforme as regras definidas no Requisito 9
4. THE Aplicação SHALL exibir o layout de forma legível e sem sobreposição de elementos em viewports com largura mínima de 320px até largura de desktop, mantendo todos os controles acessíveis e o texto do feed legível sem necessidade de rolagem horizontal
5. WHILE a largura do viewport é inferior a 720px, THE Aplicação SHALL ajustar o container principal para ocupar a largura total disponível com espaçamento interno

### Requisito 9: Tempo Relativo

**User Story:** Como um usuário, eu quero ver há quanto tempo cada desabafo foi publicado, para que eu tenha noção da recência do conteúdo.

#### Critérios de Aceitação

1. WHEN um desabafo foi publicado há menos de 60 segundos, THE Aplicação SHALL exibir "agora"
2. WHEN um desabafo foi publicado há 60 segundos ou mais e menos de 60 minutos, THE Aplicação SHALL exibir a quantidade de minutos (truncada para inteiro) seguida de "min atrás"
3. WHEN um desabafo foi publicado há 60 minutos ou mais e menos de 24 horas, THE Aplicação SHALL exibir a quantidade de horas (truncada para inteiro) seguida de "h atrás"
4. WHEN um desabafo foi publicado há 24 horas ou mais, THE Aplicação SHALL exibir a data formatada no padrão local (dd/MM/yyyy)
5. THE Aplicação SHALL atualizar o tempo relativo exibido nos cards a cada 60 segundos sem necessidade de recarregar a página

### Requisito 10: Autenticação com Google

**User Story:** Como um Visitante, eu quero fazer login com minha conta Google, para que eu possa publicar desabafos e comentários na aplicação.

#### Critérios de Aceitação

1. WHILE o Visitante não está autenticado, THE Aplicação SHALL exibir um botão "Entrar com Google" no cabeçalho
2. WHEN o Visitante clica no botão "Entrar com Google", THE Aplicação SHALL iniciar o fluxo de autenticação via Firebase_Authentication com provedor Google e exibir um indicador de carregamento até a conclusão do fluxo
3. WHEN a autenticação é concluída com sucesso, THE Aplicação SHALL armazenar a sessão do Usuário_Autenticado, exibir o botão "Sair" no cabeçalho em substituição ao botão "Entrar com Google" e tornar visível o formulário de publicação de desabafo
4. WHEN o Usuário_Autenticado clica no botão "Sair", THE Aplicação SHALL encerrar a sessão via Firebase_Authentication e retornar a interface ao estado de Visitante, exibindo o botão "Entrar com Google" e ocultando o formulário de publicação
5. WHEN a página é carregada e existe uma sessão ativa no Firebase_Authentication, THE Aplicação SHALL restaurar automaticamente o estado autenticado sem exigir novo login
6. IF ocorrer uma falha durante o processo de autenticação, THEN THE Aplicação SHALL exibir uma mensagem informando o erro ao Visitante e manter o botão "Entrar com Google" disponível para nova tentativa
7. IF o Visitante cancelar o fluxo de autenticação (fechar popup ou negar permissão), THEN THE Aplicação SHALL retornar ao estado de Visitante sem exibir mensagem de erro
8. WHILE o Visitante não está autenticado, THE Aplicação SHALL ocultar o formulário de publicação de desabafo e exibir uma mensagem convidando o Visitante a fazer login para publicar
9. WHILE o Visitante não está autenticado, THE Aplicação SHALL permitir a visualização do feed e interação com reações

### Requisito 11: Comentários nos Desabafos

**User Story:** Como um Usuário_Autenticado, eu quero comentar nos desabafos de outras pessoas, para que eu possa oferecer apoio e acolhimento de forma mais pessoal.

#### Critérios de Aceitação

1. THE Aplicação SHALL exibir em cada card do feed um botão para expandir a seção de comentários do desabafo
2. WHEN o Usuário_Autenticado ou Visitante expande a seção de comentários, THE Aplicação SHALL exibir no máximo 50 comentários existentes ordenados do mais antigo para o mais recente
3. WHEN o Usuário_Autenticado submete um Comentário_Válido, THE Aplicação SHALL persistir o comentário no Firestore associando o identificador do Usuário_Autenticado, o identificador do desabafo e a data de criação
4. WHEN o comentário é publicado com sucesso, THE Aplicação SHALL exibir o novo comentário na lista sem recarregar a página, limpar o campo de texto e incrementar o contador de comentários exibido ao lado do botão de expandir
5. THE Aplicação SHALL exibir cada comentário com o texto e o tempo relativo da publicação conforme as regras definidas no Requisito 9, sem exibir informações identificáveis do autor
6. THE Aplicação SHALL exibir o número total de comentários de cada desabafo ao lado do botão de expandir comentários, iniciando em 0 para desabafos sem comentários
7. IF o Usuário_Autenticado tenta submeter um comentário vazio ou contendo apenas espaços, THEN THE Aplicação SHALL exibir um alerta informando que é necessário escrever algo
8. IF o texto do comentário exceder 500 caracteres, THEN THE Aplicação SHALL impedir a submissão e informar o limite de caracteres, exibindo um contador de caracteres restantes no campo de texto
9. IF ocorrer uma falha ao persistir o comentário no Firestore, THEN THE Aplicação SHALL exibir uma mensagem de erro e manter o texto no campo para nova tentativa
10. WHILE o Visitante não está autenticado, THE Aplicação SHALL exibir os comentários existentes mas ocultar o campo de submissão de novo comentário, exibindo uma mensagem convidando o Visitante a fazer login para comentar
11. THE Aplicação SHALL permitir que o Usuário_Autenticado comente em qualquer desabafo, incluindo desabafos de sua própria autoria
