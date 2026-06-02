# Implementation Plan: enhance-002-feed-comment-pagination

## Overview

Refatorar a exibição de comentários no feed para que sejam sempre visíveis (máximo 5), adicionar link "ver mais" para navegação à página completa, e restringir o formulário de comentário exclusivamente à `PaginaDesabafo`. As mudanças envolvem parametrizar o `ComentarioSection`, simplificar o `DesabafoCard`, criar o componente `LinkVerMais`, e atualizar a interface `Desabafo` com o campo `numero`.

## Tasks

- [x] 1. Atualizar interfaces e tipos base
  - [x] 1.1 Adicionar campo `numero` à interface `Desabafo` e atualizar `ComentarioSectionProps`
    - Em `src/types/index.ts`: adicionar `numero?: number` à interface `Desabafo`
    - Em `src/types/index.ts`: adicionar `limite?: number` e `mostrarFormulario?: boolean` à interface `ComentarioSectionProps`
    - _Requirements: 2.1, 3.2, 4.4_

- [x] 2. Refatorar ComentarioSection para ser parametrizável
  - [x] 2.1 Implementar props `limite` e `mostrarFormulario` no ComentarioSection
    - Em `src/components/ComentarioSection.tsx`: aceitar as novas props com defaults (`mostrarFormulario=true`, `limite` sem default usa 50 existente)
    - Usar o valor de `limite` na chamada `buscarComentarios(desabafoId, limite ?? 50)`
    - Quando `mostrarFormulario=false`: não renderizar o bloco do textarea, botão "Comentar", contador de caracteres, nem a mensagem de login
    - Quando `mostrarFormulario=true`: manter comportamento atual (formulário para autenticados, mensagem de login para visitantes)
    - _Requirements: 2.1, 4.1, 4.4_

  - [ ]* 2.2 Escrever teste de propriedade para controle do formulário via prop
    - **Property 4: Controle do Formulário via Prop**
    - **Validates: Requirements 4.1, 4.4**

  - [ ]* 2.3 Escrever testes unitários do ComentarioSection refatorado
    - Verificar que com `mostrarFormulario=false` não há textarea nem botão "Comentar" no DOM
    - Verificar que com `mostrarFormulario=true` e `usuarioAutenticado=true` renderiza formulário
    - Verificar que com `mostrarFormulario=true` e `usuarioAutenticado=false` exibe mensagem de login
    - Verificar que `buscarComentarios` é chamado com o valor correto de `limite`
    - _Requirements: 2.1, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Criar componente LinkVerMais
  - [x] 3.1 Implementar componente LinkVerMais
    - Criar `src/components/LinkVerMais.tsx` com interface `LinkVerMaisProps { numero: number }`
    - Usar `<Link>` de `react-router-dom` apontando para `/desabafo/${numero}`
    - Adicionar `aria-label="Ver todos os comentários"` para acessibilidade
    - Texto exibido: "ver mais"
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.2 Criar estilos para LinkVerMais
    - Criar `src/components/LinkVerMais.css` com estilo discreto (cor secundária, font-size menor, padding sutil)
    - _Requirements: 3.3_

  - [ ]* 3.3 Escrever testes unitários do LinkVerMais
    - Verificar que renderiza o texto "ver mais"
    - Verificar que o link aponta para `/desabafo/{numero}` correto
    - Verificar presença do `aria-label`
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Checkpoint — Verificar compilação e testes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Refatorar DesabafoCard para modo preview
  - [x] 5.1 Remover toggle e renderizar comentários diretamente no DesabafoCard
    - Em `src/components/DesabafoCard.tsx`: remover `useState` de `comentariosExpandidos` e função `toggleComentarios`
    - Remover o bloco `desabafo-card__comentarios-toggle` com o botão 💬
    - Quando `desabafo.totalComentarios > 0`: renderizar `ComentarioSection` com `limite=5` e `mostrarFormulario=false`
    - Quando `desabafo.totalComentarios > 5` e `desabafo.numero` definido: renderizar `LinkVerMais`
    - Quando `desabafo.totalComentarios === 0`: não renderizar seção de comentários
    - Quando `desabafo.numero` indefinido (desabafos legados): não renderizar LinkVerMais
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.4_

  - [x] 5.2 Atualizar CSS do DesabafoCard
    - Em `src/components/DesabafoCard.css`: remover estilos do bloco `.desabafo-card__comentarios-toggle` e `.desabafo-card__comentarios-btn`
    - Adicionar estilo para `.desabafo-card__comentarios-section` (spacing, border-top sutil)
    - _Requirements: 1.1, 1.2_

  - [ ]* 5.3 Escrever teste de propriedade para limite do preview
    - **Property 1: Limite do Preview de Comentários**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 5.4 Escrever teste de propriedade para visibilidade do LinkVerMais
    - **Property 2: Visibilidade do LinkVerMais**
    - **Validates: Requirements 3.1, 3.4**

  - [ ]* 5.5 Escrever testes unitários do DesabafoCard refatorado
    - Verificar que não existe botão de toggle no DOM
    - Verificar que desabafo com `totalComentarios > 0` renderiza comentários sem interação
    - Verificar que desabafo com `totalComentarios === 0` não renderiza seção de comentários
    - Verificar que desabafo com `totalComentarios > 5` e `numero` definido exibe LinkVerMais
    - Verificar que desabafo com `totalComentarios > 5` e `numero` indefinido NÃO exibe LinkVerMais
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 3.4_

- [x] 6. Garantir uso correto na PaginaDesabafo
  - [x] 6.1 Verificar e ajustar uso do ComentarioSection na PaginaDesabafo
    - Na PaginaDesabafo (quando implementada via feature-003): o ComentarioSection deve ser chamado com `mostrarFormulario=true` e sem prop `limite`
    - Como feature-003 ainda não foi implementada: garantir que o componente ComentarioSection mantém retrocompatibilidade (comportamento default = formulário visível, sem limite)
    - _Requirements: 4.2, 4.3, 5.1, 5.2_

  - [ ]* 6.2 Escrever teste de propriedade para exibição completa
    - **Property 5: Exibição Completa na PaginaDesabafo**
    - **Validates: Requirements 5.1**

  - [ ]* 6.3 Escrever teste de propriedade para ordenação de comentários
    - **Property 3: Ordenação de Comentários**
    - **Validates: Requirements 2.2, 5.4**

- [~] 7. Checkpoint final — Garantir integridade
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de correção definidas no design
- Testes unitários validam exemplos específicos e edge cases
- O projeto usa Jest + fast-check para property-based testing e @testing-library/react para testes de componente
- A função `buscarComentarios` já suporta o parâmetro `limite` — nenhuma mudança necessária na camada de dados
- A feature depende conceitualmente de feature-002 (PaginaFeed) e feature-003 (PaginaDesabafo), mas as mudanças são standalone no código atual

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.3"] },
    { "id": 3, "tasks": ["5.1", "5.2"] },
    { "id": 4, "tasks": ["5.3", "5.4", "5.5", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] }
  ]
}
```
