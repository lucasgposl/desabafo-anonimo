# Implementation Plan: Emoji Expandido e Emoji nos Comentários

## Overview

Este plano implementa a expansão do conjunto de emojis no InputBox e a adição do emoji picker no formulário de comentários. As tarefas seguem a ordem: criar módulo compartilhado → atualizar InputBox → adicionar ao ComentarioSection → estilizar → atualizar/criar testes.

## Tasks

- [x] 1. Criar módulo compartilhado `src/constants/emojis.ts` com array `EMOJIS_EXPANDIDOS` contendo ~32 emojis organizados por categoria (amor, tristeza, raiva, alívio, força, surpresa, expressões comuns), importando `EmojiItem` de `../components/InputBox`
  - [x] 1.1 Definir o array com mínimo 25 emojis, cada um com campos `char` e `label` (label em português)
  - [x] 1.2 Exportar `EMOJIS_EXPANDIDOS` como named export
- [x] 2. Atualizar InputBox para usar emoji set expandido
  - [x] 2.1 Remover o array `EMOJIS` local do `InputBox.tsx`
  - [x] 2.2 Importar `EMOJIS_EXPANDIDOS` de `../constants/emojis`
  - [x] 2.3 Substituir referência `EMOJIS` por `EMOJIS_EXPANDIDOS` no JSX do emoji-bar
  - [x] 2.4 Manter exportação `EMOJIS` como alias de `EMOJIS_EXPANDIDOS` para backwards compatibility dos testes existentes
  - [x] 2.5 Verificar que o build compila sem erros
- [x] 3. Adicionar emoji picker ao ComentarioSection
  - [x] 3.1 Adicionar `useRef` ao import do React e importar `EMOJIS_EXPANDIDOS` e `inserirEmojiNoTexto`
  - [x] 3.2 Criar `textareaRef` com `useRef<HTMLTextAreaElement>(null)` e adicionar `ref={textareaRef}` ao textarea
  - [x] 3.3 Implementar handler `inserirEmoji` usando `inserirEmojiNoTexto` com `MAX_CARACTERES_COMENTARIO` e `requestAnimationFrame`
  - [x] 3.4 Adicionar JSX da emoji-bar entre textarea e controles com `role="toolbar"`, `aria-label="Emojis"`, botões mapeados de `EMOJIS_EXPANDIDOS`
  - [x] 3.5 Garantir que botões de emoji ficam `disabled` quando `isPublicando` é true
- [x] 4. Estilizar emoji picker do ComentarioSection
  - [x] 4.1 Adicionar classes `.comentario-section__emoji-bar` e `.comentario-section__emoji-btn` ao `ComentarioSection.css`
  - [x] 4.2 Usar mesmos valores de estilo que `.input-box__emoji-btn` (font-size 1.25rem, gap 0.375rem, border-radius 6px)
  - [x] 4.3 Adicionar estados hover com scale(1.2) e disabled com opacity 0.5
- [x] 5. Atualizar testes existentes
  - [x] 5.1 Atualizar `InputBox.test.tsx` para esperar mínimo 25 emojis ao invés de 12
  - [x] 5.2 Atualizar testes de propriedade para usar `EMOJIS_EXPANDIDOS` do novo módulo
  - [x] 5.3 Executar suite completa de testes e corrigir falhas da refatoração
- [x] 6. Adicionar testes para emoji picker nos comentários
  - [x] 6.1 Criar teste unitário: ComentarioSection renderiza emoji-bar com `role="toolbar"` quando usuário autenticado
  - [x] 6.2 Criar teste unitário: clicar emoji insere no textarea de comentário
  - [x] 6.3 Criar teste unitário: botões de emoji desabilitados durante isPublicando
  - [x] 6.4 Criar teste unitário: emoji-bar NÃO renderizada quando usuário não autenticado
  - [x] 6.5 Executar suite completa e garantir que todos os testes passam

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "5.1", "5.2", "5.3"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5"] }
  ]
}
```

Task 1 (módulo compartilhado) é pré-requisito para todas as demais. Task 2 (InputBox) e Task 5 (testes existentes) podem ser feitas em paralelo após Task 1. Task 3 (ComentarioSection) depende de Task 2. Task 4 (CSS) depende de Task 3. Task 6 (novos testes) depende de Tasks 3, 4 e 5.

## Notes

- A função `inserirEmojiNoTexto` já está exportada do `InputBox.tsx` e testada com property-based tests — não precisa ser movida
- A interface `EmojiItem` continua exportada do `InputBox.tsx` — o módulo `emojis.ts` importa de lá
- O limite de caracteres do comentário (500) é diferente do desabafo (2000) — o handler usa a constante local `MAX_CARACTERES_COMENTARIO`
