# Implementation Plan: Sentimentos e Reações Divertidos

## Overview

Refatoração completa do sistema de sentimentos e reações do "Desabafo Anônimo", substituindo os 3 sentimentos e 3 reações hardcoded por 15 sentimentos (categorizados em "Dramas" e "Good Vibes") e 8 reações no estilo internet brasileira. A implementação é dirigida por um arquivo de configuração centralizado (`src/config/sentimentos.ts`) que serve como single source of truth, com tipos TypeScript derivados automaticamente via `keyof typeof`.

## Tasks

- [x] 1. Criar módulo de configuração centralizado e atualizar tipos
  - [x] 1.1 Criar `src/config/sentimentos.ts` com SENTIMENTO_CONFIG, REACAO_CONFIG, tipos e helpers
    - Definir `SENTIMENTO_CONFIG` com os 15 sentimentos (9 dramas + 6 good_vibes) usando `as const satisfies`
    - Definir `REACAO_CONFIG` com as 8 reações usando `as const satisfies`
    - Exportar tipos `Sentimento`, `TipoReacao`, `CategoriaSentimento` via `keyof typeof`
    - Exportar constante `CATEGORIAS` com labels de exibição
    - Implementar helpers: `sentimentosPorCategoria()`, `criarReacoesIniciais()`, `isSentimentoValido()`, `obterInfoSentimento()`, `normalizarReacoes()`
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 3.1, 4.1, 4.3, 4.5, 9.4, 9.5_

  - [x] 1.2 Atualizar `src/types/index.ts` — remover unions hardcoded e importar do config
    - Remover `type Sentimento = 'triste' | 'raiva' | 'alivio'` e `type TipoReacao = 'apoio' | 'forca' | 'pouco'`
    - Importar e re-exportar `Sentimento` e `TipoReacao` de `../config/sentimentos`
    - Alterar campo `reacoes` em `DesabafoDoc` para `Record<TipoReacao, number>`
    - Alterar campo `reacoes` em `Desabafo` para `Record<TipoReacao, number>`
    - Alterar campo `sentimento` em `Desabafo` para `string` (suporte a legados na leitura)
    - Atualizar `FeedControlsProps.filtroAtivo` para usar tipo `Sentimento` importado
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 9.1_

  - [ ]* 1.3 Escrever testes de propriedade para o módulo de configuração
    - Criar `src/__tests__/properties/sentimentosConfig.property.test.ts`
    - **Property 1: Integridade do schema de configuração** — verificar que todas as entradas possuem label, emoji e categoria válidos
    - **Property 8: Inicialização de reações a partir do config** — verificar que `criarReacoesIniciais()` retorna todas as chaves com zero
    - **Property 9: Normalização de reações na leitura** — verificar comportamento com subconjuntos arbitrários de chaves
    - **Property 11: Cor derivada da categoria** — verificar mapeamento correto de cor por categoria e fallback
    - **Validates: Requirements 1.1, 1.2, 4.1, 4.3, 4.5, 9.3, 9.4, 9.5**

  - [ ]* 1.4 Escrever testes unitários para conteúdo exato do config
    - Criar `src/__tests__/unit/sentimentosConfig.test.ts`
    - Verificar que SENTIMENTO_CONFIG contém exatamente 15 entradas com valores esperados
    - Verificar que REACAO_CONFIG contém exatamente 8 entradas com valores esperados
    - Verificar agrupamento por categoria (9 dramas, 6 good_vibes)
    - _Requirements: 2.1, 2.2, 3.1_

- [x] 2. Atualizar camada de dados e Firestore
  - [x] 2.1 Atualizar `src/firebase/desabafos.ts` — usar `criarReacoesIniciais()` e `normalizarReacoes()`
    - Importar `criarReacoesIniciais` e `normalizarReacoes` do config
    - Em `criarDesabafo`: substituir objeto hardcoded `{ apoio: 0, forca: 0, pouco: 0 }` por `criarReacoesIniciais()`
    - Em `buscarDesabafos`, `buscarDesabafosTrends`, `buscarTodosDesabafosAdmin`: aplicar `normalizarReacoes()` na conversão de documentos
    - _Requirements: 4.1, 4.3, 4.5, 9.2, 9.5_

  - [x] 2.2 Atualizar `src/hooks/usePublicar.ts` — usar `criarReacoesIniciais()`
    - Importar `criarReacoesIniciais` do config
    - Substituir objeto hardcoded `{ apoio: 0, forca: 0, pouco: 0 }` por `criarReacoesIniciais()`
    - _Requirements: 4.1_

  - [x] 2.3 Atualizar `firestore.rules` — remover valores hardcoded
    - Substituir `request.resource.data.sentimento in ['triste', 'raiva', 'alivio']` por validação genérica de string 1-100 chars
    - Substituir validações individuais de `reacoes.apoio`, `reacoes.forca`, `reacoes.pouco` por validação genérica de map presente
    - Manter validações existentes de auth, tamanho de texto, uid, e imutabilidade na atualização
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3. Checkpoint — Verificar compilação e config
  - Garantir que o projeto compila sem erros TypeScript após alteração dos tipos e da camada de dados. Executar `npx tsc --noEmit` e corrigir erros. Perguntar ao usuário se surgir alguma dúvida.

- [x] 4. Atualizar componentes UI
  - [x] 4.1 Atualizar `src/components/InputBox.tsx` — seletor de sentimentos agrupado por categoria
    - Importar `SENTIMENTO_CONFIG`, `sentimentosPorCategoria`, `CATEGORIAS` do config
    - Substituir renderização hardcoded de sentimentos por iteração dinâmica agrupada
    - Adicionar headings visíveis "Dramas" e "Good Vibes" para cada grupo
    - Implementar seleção exclusiva com `aria-pressed` e classe CSS ativa
    - Iniciar sem sentimento selecionado (`useState<Sentimento | null>(null)`)
    - Validar seleção obrigatória antes de publicar (impedir e exibir erro se null)
    - _Requirements: 2.3, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 4.2 Atualizar `src/components/DesabafoCard.tsx` — botões de reação dinâmicos
    - Importar `REACAO_CONFIG` do config e `obterInfoSentimento` para exibição do sentimento
    - Substituir botões de reação hardcoded por iteração sobre `REACAO_CONFIG`
    - Exibir emoji, label e contador para cada reação
    - Manter lógica de `reacaoAtiva` e `aria-pressed` para destaque visual
    - Usar `obterInfoSentimento()` para exibir sentimento com fallback para legados
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 9.4_

  - [x] 4.3 Atualizar `src/components/FeedControls.tsx` — filtro com optgroups por categoria
    - Importar `SENTIMENTO_CONFIG`, `sentimentosPorCategoria`, `CATEGORIAS` do config
    - Substituir opções hardcoded por `<optgroup>` derivados do config
    - Manter "Todos" como primeira opção selecionada por padrão
    - Exibir emoji + label em cada opção
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ]* 4.4 Escrever testes de propriedade para seleção de sentimento no InputBox
    - Criar `src/__tests__/properties/sentimentoSelecao.property.test.tsx`
    - **Property 2: Renderização de sentimentos dirigida pelo config** — verificar que todos os sentimentos do config estão presentes com agrupamento correto
    - **Property 4: Exclusividade de seleção de sentimento** — verificar que apenas 1 sentimento está ativo após sequência arbitrária de cliques
    - **Validates: Requirements 1.4, 2.3, 2.5, 6.1, 6.2, 6.3, 6.6**

  - [ ]* 4.5 Escrever testes de propriedade para reações no DesabafoCard
    - Criar `src/__tests__/properties/reacaoCard.property.test.tsx`
    - **Property 3: Renderização de reações dirigida pelo config** — verificar botões gerados na ordem do config
    - **Property 5: Incremento de reação (optimistic)** — verificar incremento de +1 no contador correto
    - **Property 6: Troca de reação (swap)** — verificar decremento da anterior e incremento da nova
    - **Property 7: Idempotência de re-clique** — verificar nenhuma mudança ao re-clicar
    - **Validates: Requirements 1.5, 3.2, 3.3, 3.4, 3.5, 3.7**

  - [ ]* 4.6 Escrever teste de propriedade para filtro no feed
    - Criar `src/__tests__/properties/feedFiltro.property.test.ts`
    - **Property 10: Filtro de sentimento no feed** — verificar que filtro retorna apenas desabafos com sentimento correspondente
    - **Validates: Requirements 7.3, 7.4**

- [x] 5. Atualizar utilitários e estilos
  - [x] 5.1 Atualizar `src/utils/` — `obterCorSentimento` baseado em categoria
    - Importar `SENTIMENTO_CONFIG` e `CategoriaSentimento` do config
    - Substituir mapeamento por sentimento individual por mapeamento por categoria
    - Usar CSS variables: `var(--cor-dramas)`, `var(--cor-good-vibes)`, `var(--cor-neutro)` para fallback
    - _Requirements: 9.3_

  - [x] 5.2 Adicionar CSS variables para cores de categoria
    - Definir `--cor-dramas`, `--cor-good-vibes`, `--cor-neutro` no arquivo CSS principal (`:root`)
    - Ajustar estilos do InputBox para layout agrupado de sentimentos
    - Ajustar estilos do DesabafoCard para 8 botões de reação (layout responsivo)
    - _Requirements: 9.3_

  - [x] 5.3 Remover referências hardcoded restantes aos valores antigos
    - Buscar e remover qualquer referência a `'triste'`, `'raiva'`, `'alivio'`, `'apoio'`, `'forca'`, `'pouco'` em componentes, hooks e utils
    - Garantir que nenhum union type literal ou lista de valores antigos permanece no código
    - _Requirements: 9.1, 9.2, 9.6_

- [x] 6. Checkpoint — Verificar compilação e testes existentes
  - Executar `npx tsc --noEmit` para garantir zero erros de tipo. Executar testes unitários existentes e corrigir quebras causadas pela refatoração. Perguntar ao usuário se surgir alguma dúvida.

- [x] 7. Atualizar testes unitários existentes
  - [x] 7.1 Atualizar `src/__tests__/unit/InputBox.test.tsx`
    - Ajustar testes para novo comportamento: sentimentos agrupados, seleção via config, validação obrigatória
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [x] 7.2 Atualizar `src/__tests__/unit/DesabafoCard.test.tsx`
    - Ajustar testes para novos botões de reação dinâmicos derivados do config
    - _Requirements: 3.2, 3.7_

  - [x] 7.3 Atualizar `src/__tests__/unit/FeedControls.test.tsx`
    - Ajustar testes para filtro com optgroups e sentimentos derivados do config
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 7.4 Atualizar `src/__tests__/unit/usePublicar.test.ts`
    - Ajustar mocks e assertions para usar novos sentimentos e `criarReacoesIniciais()`
    - _Requirements: 4.1_

  - [x] 7.5 Atualizar `src/__tests__/unit/useReacoes.test.ts`
    - Ajustar testes para novos tipos de reação derivados do config
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [x] 8. Final checkpoint — Garantir que todos os testes passam
  - Executar a suíte completa de testes (`npx jest --run`). Garantir que todos os testes (unitários e de propriedade) passam. Perguntar ao usuário se surgir alguma dúvida.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de corretude (fast-check)
- Testes unitários validam exemplos específicos e edge cases
- A linguagem de implementação é TypeScript (conforme o design)
- O projeto usa Jest como test runner e fast-check para PBT (já instalados)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "5.1", "5.2"] },
    { "id": 4, "tasks": ["4.4", "4.5", "4.6", "5.3"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5"] }
  ]
}
```
