# Implementation Plan: Emoji Picker Bar

## Overview

Adicionar uma barra de emojis inline ao componente `InputBox`, permitindo que o usuário clique em um emoji para inseri-lo na posição atual do cursor no textarea. A implementação segue abordagem bottom-up: primeiro a lógica pura extraída (`inserirEmojiNoTexto`), depois as modificações no componente e CSS, e por último os testes.

## Tasks

- [x] 1. Criar helper puro e constante EMOJIS
  - [x] 1.1 Criar a função `inserirEmojiNoTexto` e a interface `EmojiItem` em `src/components/InputBox.tsx`
    - Definir a interface `EmojiItem` com campos `char` (string) e `label` (string)
    - Implementar a função pura exportada `inserirEmojiNoTexto(texto, emoji, cursorPos, maxCaracteres)` que retorna `{ novoTexto, novaPosicao } | null`
    - Retorna `null` se `texto.length + emoji.length > maxCaracteres`
    - Caso contrário, retorna o texto com o emoji inserido na posição do cursor e a nova posição do cursor
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 1.2 Definir a constante estática `EMOJIS` em `src/components/InputBox.tsx`
    - Criar array com mínimo 12 emojis de categorias diversas (feliz, triste, raiva, amor, surpresa, expressões comuns)
    - Cada item deve ter `char` e `label` (nome em português para aria-label)
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Modificar componente InputBox para incluir emoji picker
  - [x] 2.1 Adicionar `useRef` ao textarea em `src/components/InputBox.tsx`
    - Importar `useRef` de React
    - Criar `textareaRef = useRef<HTMLTextAreaElement>(null)`
    - Passar `ref={textareaRef}` ao elemento `<textarea>`
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Implementar handler `inserirEmoji` no componente `InputBox`
    - Ler `selectionStart` do `textareaRef.current` (fallback para `texto.length` se null)
    - Chamar `inserirEmojiNoTexto` com os parâmetros adequados
    - Se resultado não for null, atualizar estado `texto` com `novoTexto`
    - Usar `requestAnimationFrame` para restaurar cursor e foco no textarea após re-render
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Adicionar JSX da barra de emojis em `src/components/InputBox.tsx`
    - Inserir `<div className="input-box__emoji-bar" role="toolbar" aria-label="Emojis">` entre o textarea e o div `.input-box__controles`
    - Renderizar um `<button>` para cada item de `EMOJIS` com `aria-label={emoji.label}`, `title={emoji.label}`, e `disabled={isPublicando}`
    - Cada botão dispara `inserirEmoji(emoji.char)` no onClick
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.3, 4.1, 4.2, 4.3_

- [x] 3. Adicionar estilos CSS para emoji bar
  - [x] 3.1 Criar classes CSS em `src/components/InputBox.css`
    - Adicionar `.input-box__emoji-bar`: display flex, flex-wrap wrap, gap consistente
    - Adicionar `.input-box__emoji-btn`: botão transparente com font-size adequado, border-radius, cursor pointer, transição suave
    - Adicionar `.input-box__emoji-btn:hover:not(:disabled)`: escala sutil (transform scale)
    - Adicionar `.input-box__emoji-btn:disabled`: opacidade reduzida, cursor not-allowed
    - Usar CSS custom properties do projeto para manter consistência visual
    - _Requirements: 1.4, 5.1, 5.2_

- [x] 4. Checkpoint - Verificar funcionalidade visual
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Testes automatizados
  - [x]* 5.1 Escrever property test para inserção de emoji (Property 1)
    - **Property 1: Emoji insertion preserves surrounding text and places emoji at cursor**
    - Usar fast-check para gerar strings aleatórias (0–1990 chars), posições de cursor válidas, e emojis do set
    - Verificar que `inserirEmojiNoTexto` produz `texto.slice(0, cursor) + emoji + texto.slice(cursor)` e posição correta
    - Mínimo 100 iterações
    - Criar arquivo `src/__tests__/properties/inserirEmojiNoTexto.property.test.ts`
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x]* 5.2 Escrever property test para limite de caracteres (Property 2)
    - **Property 2: Character limit enforcement on emoji insertion**
    - Usar fast-check para gerar strings de comprimento 1990–2000 e tentar inserção
    - Verificar que retorna `null` quando limite seria excedido, e sucesso caso contrário
    - Mínimo 100 iterações
    - Criar no mesmo arquivo `src/__tests__/properties/inserirEmojiNoTexto.property.test.ts`
    - **Validates: Requirements 2.5**

  - [x]* 5.3 Escrever property test para renderização de emojis (Property 3)
    - **Property 3: Every emoji in the set renders a button with correct aria-label**
    - Para cada emoji no array `EMOJIS`, verificar que existe um botão com `aria-label` igual ao `label` e conteúdo textual igual ao `char`
    - Criar arquivo `src/__tests__/properties/emojiPickerRender.property.test.ts`
    - **Validates: Requirements 3.3, 4.3**

  - [x]* 5.4 Escrever unit tests para InputBox com emoji picker
    - Testar que a barra renderiza com `role="toolbar"` e `aria-label="Emojis"`
    - Testar que no mínimo 8 botões de emoji são renderizados
    - Testar que a barra fica entre o textarea e os controles no DOM
    - Testar que todos os botões ficam desabilitados quando `isPublicando=true`
    - Testar que clicar em um emoji insere no valor do textarea
    - Criar/atualizar arquivo `src/__tests__/unit/InputBox.test.tsx`
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 4.1, 4.2**

- [x] 6. Checkpoint final - Garantir que todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser ignoradas para MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude
- Unit tests validam exemplos específicos e edge cases
- A função `inserirEmojiNoTexto` é extraída como helper puro para facilitar testes de propriedade sem dependência do DOM
- O componente `InputBox` já existe e será modificado in-place — não é criado um novo componente

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4"] }
  ]
}
```
