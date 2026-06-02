# Implementation Plan

## Overview

Plano de implementação para tornar a validação de sentimentos e reações flexível no Firestore e nos testes. Segue a metodologia de bug condition: primeiro explora o bug com testes property-based, depois preserva o comportamento existente, implementa o fix e valida.

**Dependência**: Este fix depende do enhance-005-fun-sentiments-reactions Task 1.1 (criação de `src/config/sentimentos.ts`). O helper de fixtures referencia esse arquivo de config.

## Tasks

- [x] 1. Escrever teste exploratório do Bug Condition (ANTES do fix)
  - **Property 1: Bug Condition** - Validação Rígida Rejeita Novos Sentimentos/Reações
  - **CRITICAL**: Este teste DEVE FALHAR no código não-corrigido — a falha confirma que o bug existe
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: Este teste codifica o comportamento esperado — ele validará o fix quando passar após a implementação
  - **GOAL**: Demonstrar counterexamples que evidenciam a rejeição de valores válidos pelas rules atuais
  - **Scoped PBT Approach**: Gerar strings aleatórias de 1-100 chars (excluindo 'triste', 'raiva', 'alivio') como sentimentos válidos; gerar maps com chaves aleatórias e valores inteiros >= 0 como reações válidas
  - Criar arquivo `src/__tests__/properties/flexibleValidation.property.test.ts`
  - Usar fast-check para gerar inputs onde `isBugCondition(X)` é verdadeiro:
    - `X.sentimento` é string de 1-100 chars E `X.sentimento NOT IN ['triste', 'raiva', 'alivio']`
    - OU `keys(X.reacoes) != {'apoio', 'forca', 'pouco'}` mas todos os valores são inteiros >= 0
  - Simular a lógica de validação das rules atuais (criar função `validarRulesOriginais(input)`)
  - Assertar que as rules ATUAIS REJEITAM esses inputs (comportamento bugado atual)
  - Rodar no código NÃO-corrigido — esperar FALHA se o teste asserta o comportamento ESPERADO (aceitação)
  - **EXPECTED OUTCOME**: Teste FALHA (confirma que as rules rejeitam valores válidos — o bug existe)
  - Documentar counterexamples encontrados (ex: `sentimento: 'ansiedade'` rejeitado, `reacoes: { abraco: 0 }` rejeitado)
  - Marcar task como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.1, 1.2_

- [x] 2. Escrever testes de preservação (ANTES de implementar o fix)
  - **Property 2: Preservation** - Comportamento Existente com Valores Originais
  - **IMPORTANT**: Seguir metodologia observation-first
  - Criar arquivo `src/__tests__/properties/flexibleValidationPreservation.property.test.ts`
  - Observar: validação das rules atuais ACEITA inputs com `sentimento IN ['triste', 'raiva', 'alivio']` E `reacoes = { apoio: 0, forca: 0, pouco: 0 }` (desde que texto e auth sejam válidos)
  - Observar: validação das rules atuais REJEITA texto vazio ou > 2000 chars mesmo com sentimentos válidos
  - Observar: validação das rules atuais REJEITA criação sem autenticação
  - Observar: rules de update protegem imutabilidade de `texto`, `sentimento`, `criadoEm`, `uid`
  - Escrever property-based tests com fast-check:
    - Para todo input onde `NOT isBugCondition(X)` (sentimentos e reações originais), o resultado da validação DEVE ser o mesmo entre rules originais e rules corrigidas
    - Gerar textos aleatórios de 1-2000 chars com sentimentos originais → rules aceitam
    - Gerar textos vazios ou > 2000 chars com sentimentos originais → rules rejeitam
  - Verificar que testes PASSAM no código NÃO-corrigido
  - **EXPECTED OUTCOME**: Testes PASSAM (confirma baseline de comportamento a preservar)
  - Marcar task como completa quando testes escritos, executados e passando no código não-corrigido
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Correção da validação flexível de sentimentos e reações

  - [x] 3.1 Atualizar `firestore.rules` — substituir validação de sentimento por lista fixa
    - Remover: `request.resource.data.sentimento in ['triste', 'raiva', 'alivio']`
    - Substituir por: `request.resource.data.sentimento is string && request.resource.data.sentimento.size() >= 1 && request.resource.data.sentimento.size() <= 100`
    - _Bug_Condition: isBugCondition(X) onde X.sentimento NOT IN ['triste', 'raiva', 'alivio']_
    - _Expected_Behavior: Qualquer string de 1-100 chars é aceita como sentimento_
    - _Preservation: Sentimentos originais ('triste', 'raiva', 'alivio') continuam aceitos_
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.2 Atualizar `firestore.rules` — substituir validação de reações por campos específicos
    - Remover: `request.resource.data.reacoes.apoio == 0 && request.resource.data.reacoes.forca == 0 && request.resource.data.reacoes.pouco == 0`
    - Substituir por: `request.resource.data.reacoes is map` (validação genérica de tipo)
    - Nota: Firestore Rules não suportam iteração sobre maps — validação de valores individuais (inteiros >= 0) delegada ao código da aplicação que constrói o objeto a partir da config centralizada
    - _Bug_Condition: isBugCondition(X) onde keys(X.reacoes) != {'apoio', 'forca', 'pouco'}_
    - _Expected_Behavior: Qualquer map é aceito como reações na criação_
    - _Preservation: Estrutura original {apoio: 0, forca: 0, pouco: 0} continua aceita_
    - _Requirements: 1.2, 2.2, 3.1_

  - [x] 3.3 Criar helper de fixture dinâmica para testes
    - Criar `src/__tests__/helpers/fixtureHelper.ts`
    - Importar `SENTIMENTO_CONFIG` e `REACAO_CONFIG` de `../../config/sentimentos` (criado por enhance-005 Task 1.1)
    - Exportar `criarReacoesZeradas()`: `Object.fromEntries(Object.keys(REACAO_CONFIG).map(k => [k, 0]))`
    - Exportar `criarReacoesMock(overrides)`: merge de reações zeradas com overrides
    - Exportar `sentimentoPadrao()`: `Object.keys(SENTIMENTO_CONFIG)[0]`
    - Exportar `todosSentimentos()`: `Object.keys(SENTIMENTO_CONFIG)`
    - NOTA: Se `src/config/sentimentos.ts` ainda não existir (enhance-005 Task 1.1 pendente), referenciar o caminho correto — o helper será funcional quando a dependência for satisfeita
    - _Requirements: 2.3, 2.4_

  - [x] 3.4 Atualizar `src/__tests__/unit/usePublicar.test.ts`
    - Importar helpers de `../helpers/fixtureHelper`
    - Substituir `reacoes: { apoio: 0, forca: 0, pouco: 0 }` por `criarReacoesZeradas()`
    - Substituir `'triste'`, `'raiva'`, `'alivio'` como literais por `sentimentoPadrao()` onde usado como default
    - Substituir `it.each(['triste', 'raiva', 'alivio'] as const)` por `it.each(todosSentimentos())`
    - Atualizar o `expect` do retorno para usar `reacoes: criarReacoesZeradas()`
    - _Bug_Condition: it.each hardcoded não inclui novos sentimentos_
    - _Preservation: Lógica de validação de texto, erro e estado não muda_
    - _Requirements: 1.3, 2.3, 3.5_

  - [x] 3.5 Atualizar `src/__tests__/unit/useDesabafo.test.ts`
    - Importar helpers de `../helpers/fixtureHelper`
    - Substituir `sentimento: 'triste'`, `sentimento: 'raiva'`, `sentimento: 'alivio'` por `sentimentoPadrao()` ou valores da config
    - Substituir `reacoes: { apoio: 5, forca: 2, pouco: 1 }` e `reacoes: { apoio: 0, forca: 0, pouco: 0 }` por `criarReacoesMock(...)` e `criarReacoesZeradas()`
    - _Preservation: Lógica de busca, validação de número e reatividade não muda_
    - _Requirements: 1.3, 2.3, 3.5_

  - [x] 3.6 Atualizar `src/__tests__/unit/useDesabafos.test.ts`
    - Importar helpers de `../helpers/fixtureHelper`
    - Atualizar função `criarDesabafoMock`: usar `sentimentoPadrao()` como default e `criarReacoesZeradas()` para reações
    - _Preservation: Lógica de paginação, filtro, refresh e inserção não muda_
    - _Requirements: 1.3, 1.4, 2.3, 2.4, 3.5_

  - [x] 3.7 Atualizar `src/__tests__/unit/useReacoes.test.ts`
    - Importar helpers de `../helpers/fixtureHelper`
    - Atualizar função `criarDesabafoMock`: usar `sentimentoPadrao()` e `criarReacoesZeradas()`
    - Substituir literais de reações nos assertions (e.g., `reacoes: { apoio: 5, forca: 3, pouco: 1 }`) por `criarReacoesMock({ apoio: 5, forca: 3, pouco: 1 })` — mantém compatibilidade com chaves que possam mudar
    - Nota: Os nomes das chaves nos assertions de incremento individual (`reacoes.apoio`, `reacoes.forca`) devem usar `Object.keys(REACAO_CONFIG)[0]` etc., ou manter literais com comentário indicando que são chaves da config atual
    - _Preservation: Lógica de optimistic update, rollback e persistência não muda_
    - _Requirements: 1.4, 2.4, 3.6_

  - [x] 3.8 Atualizar `src/__tests__/unit/trends.test.ts`
    - Importar helpers de `../helpers/fixtureHelper`
    - Atualizar função `criarDesabafo`: usar `sentimentoPadrao()` e `criarReacoesZeradas()`
    - Substituir literais de reações nos testes de cálculo (e.g., `reacoes: { apoio: 5, forca: 3, pouco: 2 }`) por `criarReacoesMock({ apoio: 5, forca: 3, pouco: 2 })`
    - _Preservation: Cálculos de totalInteracoes e ordenação por popularidade não mudam_
    - _Requirements: 1.4, 2.4, 3.7_

  - [x] 3.9 Verificar que teste exploratório do Bug Condition agora passa
    - **Property 1: Expected Behavior** - Validação Flexível Aceita Novos Valores
    - **IMPORTANT**: Re-executar o MESMO teste do task 1 — NÃO escrever um novo teste
    - O teste do task 1 codifica o comportamento esperado (aceitação de novos valores)
    - Quando este teste passa, confirma que o comportamento esperado é satisfeito
    - Rodar `src/__tests__/properties/flexibleValidation.property.test.ts`
    - **EXPECTED OUTCOME**: Teste PASSA (confirma que o bug foi corrigido)
    - _Requirements: 2.1, 2.2_

  - [x] 3.10 Verificar que testes de preservação continuam passando
    - **Property 2: Preservation** - Comportamento Existente Inalterado
    - **IMPORTANT**: Re-executar os MESMOS testes do task 2 — NÃO escrever novos testes
    - Rodar `src/__tests__/properties/flexibleValidationPreservation.property.test.ts`
    - **EXPECTED OUTCOME**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após o fix (nenhuma regressão)

- [x] 4. Checkpoint — Garantir que todos os testes passam
  - Executar suite completa de testes: `npx jest --run`
  - Verificar que TODOS os testes unitários existentes passam com as fixtures atualizadas
  - Verificar que os testes property-based (exploratório + preservação) passam
  - Verificar que `firestore.rules` pode ser validado sem erros de sintaxe
  - Se houver dúvidas ou falhas inesperadas, perguntar ao usuário antes de prosseguir

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["3.4", "3.5", "3.6", "3.7", "3.8"] },
    { "id": 3, "tasks": ["3.9", "3.10"] },
    { "id": 4, "tasks": ["4"] }
  ]
}
```

## Notes

- **Dependência externa**: Este fix depende de `enhance-005-fun-sentiments-reactions` Task 1.1 que cria `src/config/sentimentos.ts` com exports `SENTIMENTO_CONFIG` e `REACAO_CONFIG`. Se essa task ainda não foi executada, o helper de fixtures (3.3) vai referenciar o caminho correto mas o import falhará até a dependência ser satisfeita.
- **Limitação do Firestore Rules**: Security Rules não suportam iteração sobre maps. A validação de que todos os valores de `reacoes` são inteiros >= 0 é delegada ao código da aplicação.
- **Estratégia de testes**: Os testes property-based simulam a lógica das rules em TypeScript (não testam o Firestore real). Para validação end-to-end das rules, seria necessário o emulador do Firestore — fora do escopo deste fix.
