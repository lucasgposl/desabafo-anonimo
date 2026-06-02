# Requirements Document

## Introduction

Este aprimoramento expande significativamente o conjunto de emojis disponíveis no emoji picker do InputBox (desabafo) e replica a funcionalidade de emoji picker na seção de comentários (ComentarioSection). Atualmente, o InputBox possui apenas 12 emojis que não preenchem toda a largura da área de texto. O objetivo é adicionar emojis suficientes para preencher a largura completa do textarea e disponibilizar a mesma barra de emojis no campo de comentários, permitindo que usuários expressem emoções de forma mais rica em ambos os contextos.

## Glossary

- **Emoji_Picker_Bar**: Elemento UI horizontal que exibe botões de emojis clicáveis, posicionado entre o textarea e os controles
- **InputBox**: Componente React onde o usuário compõe o texto do desabafo, contendo textarea, seletor de sentimento e botão publicar
- **ComentarioSection**: Componente React que exibe comentários de um desabafo e permite ao usuário autenticado adicionar novos comentários
- **Emoji_Set_Expandido**: Coleção ampliada de emojis diversos, dimensionada para preencher toda a largura da área de texto
- **Cursor_Position**: Ponto de inserção de texto (caret) dentro do textarea onde novos caracteres serão inseridos
- **inserirEmojiNoTexto**: Função helper pura que realiza a inserção do emoji no texto na posição do cursor

## Requirements

### Requisito 1: Expansão do Conjunto de Emojis do InputBox

**User Story:** Como usuário escrevendo um desabafo, eu quero ter acesso a um conjunto muito maior de emojis, para que eu possa expressar uma variedade mais ampla de emoções no meu texto.

#### Critérios de Aceitação

1. THE Emoji_Set_Expandido SHALL conter no mínimo 25 emojis e no máximo 40 emojis, definidos como objetos com caractere e label de acessibilidade
2. THE Emoji_Set_Expandido SHALL incluir no mínimo 2 emojis de cada uma das seguintes categorias emocionais: alegria, tristeza, raiva, amor, surpresa, medo, alívio, encorajamento e expressões faciais do cotidiano (ex: pensativo, cansado, rindo)
3. THE Emoji_Set_Expandido SHALL ser definido como um array constante exportado de um único módulo compartilhado, importado tanto pelo componente InputBox quanto pelo componente ComentarioSection
4. WHEN a largura do container for menor que a largura total ocupada pelos botões de emojis dispostos lado a lado, THE Emoji_Picker_Bar SHALL aplicar quebra de linha (flex-wrap) para exibir todos os emojis em múltiplas linhas sem overflow horizontal
5. THE Emoji_Picker_Bar SHALL manter um gap uniforme de no mínimo 4px e no máximo 8px entre os botões de emojis, independente do número de emojis exibidos ou do número de linhas resultante da quebra
6. WHEN o usuário clicar em um botão de emoji na Emoji_Picker_Bar, THE Sistema SHALL inserir o caractere do emoji na posição atual do cursor dentro do textarea associado

### Requisito 2: Emoji Picker na Seção de Comentários

**User Story:** Como usuário escrevendo um comentário de apoio, eu quero poder inserir emojis no meu texto, para que eu possa expressar empatia e emoções de forma mais rica nos comentários.

#### Critérios de Aceitação

1. WHILE o formulário de comentário estiver visível e o usuário estiver autenticado, THE ComentarioSection SHALL exibir uma Emoji_Picker_Bar entre o textarea e os controles do formulário, contendo no mínimo 8 emojis clicáveis representando diferentes emoções
2. WHEN o usuário clicar em um emoji na Emoji_Picker_Bar do comentário, THE ComentarioSection SHALL inserir o emoji selecionado na Cursor_Position atual do textarea de comentário
3. WHEN um emoji for inserido no comentário e nenhuma Cursor_Position estiver definida (textarea não recebeu foco anteriormente), THE ComentarioSection SHALL adicionar o emoji ao final do texto existente
4. WHEN um emoji for inserido no comentário, THE ComentarioSection SHALL atualizar a Cursor_Position para imediatamente após o emoji inserido e manter o foco no textarea para que o usuário possa continuar digitando
5. IF a inserção de um emoji fizer o texto exceder o limite máximo de 500 caracteres, THEN THE ComentarioSection SHALL impedir a inserção e manter o texto inalterado
6. WHEN um emoji for inserido no comentário, THE ComentarioSection SHALL contar o emoji como parte do comprimento total do texto para fins do limite de 500 caracteres e atualizar o contador de caracteres restantes
7. WHILE o ComentarioSection estiver no estado de publicação (isPublicando), THE Emoji_Picker_Bar do comentário SHALL desabilitar todos os botões de emoji
8. THE Emoji_Picker_Bar do comentário SHALL ter role "toolbar" com aria-label "Emojis" e cada botão de emoji SHALL ter um aria-label descritivo com o nome do emoji em português

### Requisito 3: Reutilização da Lógica de Inserção de Emoji

**User Story:** Como desenvolvedor, eu quero que a lógica de inserção de emojis seja compartilhada entre InputBox e ComentarioSection, para que o comportamento seja consistente e o código seja mantido em um único lugar.

#### Critérios de Aceitação

1. THE inserirEmojiNoTexto SHALL ser definida como uma função utilitária única, importada e utilizada tanto pelo InputBox quanto pelo ComentarioSection para realizar a inserção de emojis no texto
2. WHEN a função inserirEmojiNoTexto for chamada com um texto cuja soma do comprimento atual (texto.length) com o comprimento do emoji (emoji.length) exceda o parâmetro maxCaracteres, THE inserirEmojiNoTexto SHALL retornar null indicando que a inserção foi rejeitada sem modificar os dados de entrada
3. WHEN a função inserirEmojiNoTexto for chamada com parâmetros válidos (texto.length + emoji.length <= maxCaracteres e cursorPos no intervalo [0, texto.length]), THE inserirEmojiNoTexto SHALL retornar um objeto contendo o novo texto com o emoji inserido na posição do cursor (texto.slice(0, cursorPos) + emoji + texto.slice(cursorPos)) e a nova posição do cursor igual a cursorPos + emoji.length
4. WHEN a função inserirEmojiNoTexto for chamada pelo InputBox, THE InputBox SHALL passar maxCaracteres igual a 2000, e WHEN chamada pelo ComentarioSection, THE ComentarioSection SHALL passar maxCaracteres igual a 500
5. FOR ALL textos válidos e posições de cursor dentro do intervalo [0, texto.length] onde texto.length + emoji.length <= maxCaracteres, inserir um emoji na posição do cursor e verificar que o resultado contém o emoji na posição indicada SHALL produzir igualdade (propriedade round-trip parcial)

### Requisito 4: Acessibilidade do Emoji Picker nos Comentários

**User Story:** Como usuário que depende de tecnologias assistivas, eu quero que o emoji picker dos comentários seja completamente acessível, para que eu possa utilizá-lo com navegação por teclado e leitores de tela.

#### Critérios de Aceitação

1. THE Emoji_Picker_Bar do ComentarioSection SHALL ter role "toolbar" com aria-label "Emojis"
2. THE Emoji_Picker_Bar do ComentarioSection SHALL renderizar cada botão de emoji com um aria-label contendo o nome do emoji em português (por exemplo, "Coração", "Sorriso", "Triste")
3. WHEN o usuário navegar pela Emoji_Picker_Bar com teclado, THE Emoji_Picker_Bar SHALL suportar a tecla Tab para mover o foco para dentro da barra (primeiro botão) e para fora da barra (próximo elemento focável após a barra)
4. THE Emoji_Picker_Bar do ComentarioSection SHALL exibir um indicador de foco visível (outline) no botão de emoji atualmente focado via teclado
5. THE Emoji_Picker_Bar do ComentarioSection SHALL utilizar o mesmo padrão de nomenclatura BEM com prefixo "comentario-section__" para manter consistência com o CSS existente

### Requisito 5: Consistência Visual entre InputBox e Comentários

**User Story:** Como usuário, eu quero que o emoji picker tenha aparência visual consistente tanto no desabafo quanto nos comentários, para que a experiência seja intuitiva e reconhecível.

#### Critérios de Aceitação

1. THE Emoji_Picker_Bar do ComentarioSection SHALL utilizar o mesmo tamanho de fonte (1.25rem), padding dos botões (0.25rem), e gap entre botões (0.375rem) que a Emoji_Picker_Bar do InputBox
2. THE Emoji_Picker_Bar do ComentarioSection SHALL exibir o mesmo efeito de hover dos botões de emoji do InputBox: scale(1.2) com background-color usando a variável de superfície alternativa do projeto
3. THE Emoji_Picker_Bar do ComentarioSection SHALL exibir os mesmos emojis do Emoji_Set definido como constante no módulo compartilhado, reutilizando a mesma referência de dados
4. THE Emoji_Picker_Bar do ComentarioSection SHALL permitir wrap dos emojis para múltiplas linhas mantendo o gap de 0.375rem entre botões quando a largura do container for insuficiente para exibição em linha única
5. THE Emoji_Picker_Bar do ComentarioSection SHALL ser posicionada entre o textarea de comentário e a barra de controles (contador de caracteres e botão enviar)
