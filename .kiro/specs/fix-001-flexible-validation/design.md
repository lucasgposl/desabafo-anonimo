# Validação Flexível de Sentimentos e Reações — Bugfix Design

## Overview

O bug se manifesta como acoplamento rígido entre as regras do Firestore e os testes unitários a valores específicos de sentimentos (`'triste'`, `'raiva'`, `'alivio'`) e reações (`'apoio'`, `'forca'`, `'pouco'`). Qualquer adição ou remoção de sentimentos/reações exige redeploy das security rules E alteração manual de múltiplos arquivos de teste — um processo frágil e propenso a erros.

A estratégia de correção é dupla:
1. **Firestore rules**: substituir validação por lista fixa por validação genérica de tipo/formato (string 1-100 chars para sentimento; map com valores inteiros >= 0 para reações).
2. **Testes**: substituir literais hardcoded por imports de configuração centralizada (`SENTIMENTO_CONFIG`, `REACAO_CONFIG` de `src/config/sentimentos.ts`), tornando os testes automaticamente compatíveis com qualquer alteração futura.

## Glossary

- **Bug_Condition (C)**: A condição onde um sentimento ou conjunto de reações válido é rejeitado pelas rules/testes por não constar na lista hardcoded atual.
- **Property (P)**: O comportamento desejado — qualquer string 1-100 chars é aceita como sentimento; qualquer map com valores inteiros >= 0 é aceito como reações.
- **Preservation**: Comportamentos existentes que devem permanecer inalterados: validação de texto (1-2000 chars), autenticação obrigatória, imutabilidade de campos em updates, lógica dos hooks de publicação/reação/trends.
- **`firestore.rules`**: Arquivo de regras de segurança do Cloud Firestore que valida operações de leitura/escrita.
- **`SENTIMENTO_CONFIG`**: Configuração centralizada em `src/config/sentimentos.ts` que exporta os sentimentos disponíveis (criada por enhance-005).
- **`REACAO_CONFIG`**: Configuração centralizada em `src/config/sentimentos.ts` que exporta as reações disponíveis (criada por enhance-005).
- **Fixture dinâmica**: Objeto de teste construído a partir de `Object.keys(REACAO_CONFIG)` em vez de literais hardcoded.

## Bug Details

### Bug Condition

O bug se manifesta quando um desenvolvedor tenta usar um sentimento ou reação que não está na lista hardcoded das regras do Firestore ou dos testes. As rules rejeitam a operação, e os testes falham por usarem literais fixos.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { sentimento: string, reacoes: Map<string, number> }
  OUTPUT: boolean
  
  RETURN input.sentimento NOT IN ['triste', 'raiva', 'alivio']
         OR keys(input.reacoes) != {'apoio', 'forca', 'pouco'}
END FUNCTION
```

### Examples

- **Novo sentimento**: Um desabafo com `sentimento: 'ansiedade'` é rejeitado pelas rules (`not in ['triste', 'raiva', 'alivio']`), embora seja uma string válida de 9 caracteres.
- **Nova reação**: Um desabafo com `reacoes: { abraco: 0, coragem: 0 }` é rejeitado pelas rules porque valida campos específicos (`reacoes.apoio`, `reacoes.forca`, `reacoes.pouco`).
- **Teste quebrado**: Ao adicionar `'ansiedade'` ao sistema, `usePublicar.test.ts` falha em `it.each(['triste', 'raiva', 'alivio'])` por não incluir o novo valor.
- **Fixture desatualizada**: Ao renomear `'pouco'` para `'coragem'`, todos os testes com `reacoes: { apoio: 0, forca: 0, pouco: 0 }` falham por incompatibilidade com o tipo atualizado.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Validação de texto (1-2000 caracteres, não-vazio) nas rules deve continuar funcionando
- Autenticação obrigatória para criação (`request.auth != null`) deve continuar ativa
- Regra de que `uid == request.auth.uid` na criação deve permanecer
- Regra de que `totalComentarios == 0` na criação deve permanecer
- Imutabilidade de `texto`, `sentimento`, `criadoEm` e `uid` em updates deve permanecer
- Exclusão apenas por admins deve permanecer
- Lógica dos hooks (`usePublicar`, `useReacoes`, `useDesabafos`, `useDesabafo`) não muda — apenas os valores de fixture nos testes
- Cálculo de `calcularTotalInteracoes` e `ordenarPorPopularidade` nos testes de trends não muda

**Scope:**
Todas as operações que NÃO envolvem a validação do campo `sentimento` ou da estrutura de `reacoes` na criação de desabafos devem ser completamente inalteradas. Isso inclui:
- Leitura de desabafos (pública)
- Atualização de contadores (apenas reacoes e totalComentarios mudam de valor)
- Exclusão por admins
- Criação/leitura de comentários
- Verificação de admins

## Hypothesized Root Cause

Com base na análise do bug, as causas-raiz são claras e intencionais (decisão de design original que se tornou limitante):

1. **Validação de sentimento por lista fixa nas rules**: A linha `request.resource.data.sentimento in ['triste', 'raiva', 'alivio']` foi escrita para o MVP com apenas 3 sentimentos. Ao expandir o sistema, esta validação se torna um bloqueio que requer redeploy a cada alteração.

2. **Validação de reações por campos específicos nas rules**: As linhas `request.resource.data.reacoes.apoio == 0 && request.resource.data.reacoes.forca == 0 && request.resource.data.reacoes.pouco == 0` assumem que as chaves do map são conhecidas em tempo de escrita das rules. Qualquer nova reação é rejeitada.

3. **Literais hardcoded nos testes**: Os testes foram escritos com valores concretos (`'triste'`, `{ apoio: 0, forca: 0, pouco: 0 }`) em vez de importar de uma fonte centralizada. Não havia configuração centralizada disponível no momento da escrita original.

4. **Iteração estática no `it.each`**: O `it.each(['triste', 'raiva', 'alivio'])` em `usePublicar.test.ts` hard-codes a lista de sentimentos em vez de derivar dinamicamente de uma config.

## Correctness Properties

Property 1: Bug Condition - Validação Flexível Aceita Novos Valores

_For any_ input onde o bug condition é verdadeiro (sentimento é uma string válida de 1-100 chars que NÃO está na lista original, OU reacoes é um map com chaves diferentes das originais mas com valores inteiros >= 0), a função fixa das rules SHALL aceitar a criação do desabafo, desde que todas as outras validações (texto, uid, totalComentarios) sejam satisfeitas.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Valores Existentes e Comportamentos Inalterados

_For any_ input onde o bug condition NÃO é verdadeiro (sentimentos e reações são os mesmos da lista original), a função fixa das rules SHALL produzir exatamente o mesmo resultado que a função original, preservando toda validação existente de texto, autenticação, imutabilidade de campos e controle de acesso.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assumindo que a análise de causa-raiz está correta:

**File**: `firestore.rules`

**Function**: Regra `allow create` em `match /desabafos/{desabafoId}`

**Specific Changes**:
1. **Substituir validação de sentimento por lista**: Remover `request.resource.data.sentimento in ['triste', 'raiva', 'alivio']` e substituir por `request.resource.data.sentimento is string && request.resource.data.sentimento.size() >= 1 && request.resource.data.sentimento.size() <= 100`.

2. **Substituir validação de reações por campos específicos**: Remover `request.resource.data.reacoes.apoio == 0 && request.resource.data.reacoes.forca == 0 && request.resource.data.reacoes.pouco == 0` e substituir por `request.resource.data.reacoes is map && request.resource.data.reacoes.size() > 0` combinado com validação de que os valores são inteiros >= 0 (limitação: Firestore rules não suporta iteração sobre maps — solução alternativa pode ser necessária, como aceitar qualquer map presente e delegar validação de valores ao código da aplicação, ou usar uma Cloud Function de validação).

3. **Nota sobre limitação do Firestore Rules**: Firestore Security Rules não suportam iteração sobre chaves de um map. A abordagem pragmática é: validar que `reacoes` é um map presente (`request.resource.data.reacoes is map`) e confiar que o código da aplicação (que constrói o objeto `reacoes` a partir da config centralizada) garante os valores corretos. Alternativamente, validar um subconjunto de constraints (e.g., que o map não é vazio).

---

**File**: `src/__tests__/unit/usePublicar.test.ts`

**Specific Changes**:
4. **Importar config centralizada**: Adicionar `import { SENTIMENTO_CONFIG, REACAO_CONFIG } from '../../config/sentimentos'` no topo do arquivo.

5. **Substituir literais de sentimento**: Trocar `'triste'`, `'raiva'`, `'alivio'` por valores derivados da config (e.g., `Object.keys(SENTIMENTO_CONFIG)[0]`).

6. **Substituir fixture de reações**: Trocar `reacoes: { apoio: 0, forca: 0, pouco: 0 }` por construção dinâmica a partir de `Object.keys(REACAO_CONFIG)`.

7. **Substituir it.each estático**: Trocar `it.each(['triste', 'raiva', 'alivio'])` por `it.each(Object.keys(SENTIMENTO_CONFIG))`.

---

**Files**: `src/__tests__/unit/useDesabafo.test.ts`, `src/__tests__/unit/useDesabafos.test.ts`, `src/__tests__/unit/useReacoes.test.ts`, `src/__tests__/unit/trends.test.ts`

**Specific Changes**:
8. **Importar config centralizada**: Adicionar import de `SENTIMENTO_CONFIG` e/ou `REACAO_CONFIG` em cada arquivo.

9. **Substituir literais em factories/fixtures**: Atualizar funções `criarDesabafoMock` e `criarDesabafo` para usar valores da config em vez de literais.

10. **Construir reacoes dinamicamente**: Substituir `reacoes: { apoio: 0, forca: 0, pouco: 0 }` por `reacoes: Object.fromEntries(Object.keys(REACAO_CONFIG).map(k => [k, 0]))` ou helper equivalente.

## Testing Strategy

### Validation Approach

A estratégia de testes segue uma abordagem de duas fases: primeiro, demonstrar o bug com counterexamples no código não-corrigido; depois, verificar que o fix funciona e preserva o comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Demonstrar counterexamples que evidenciam o bug ANTES de implementar o fix. Confirmar ou refutar a análise de causa-raiz.

**Test Plan**: Escrever testes que tentam criar desabafos com sentimentos e reações fora da lista hardcoded atual e observar a rejeição pelas rules. Rodar no código NÃO-corrigido para observar falhas.

**Test Cases**:
1. **Novo sentimento nas rules**: Tentar criar desabafo com `sentimento: 'ansiedade'` — será rejeitado pelas rules atuais (falha no código não-corrigido)
2. **Nova reação nas rules**: Tentar criar desabafo com `reacoes: { abraco: 0, coragem: 0 }` — será rejeitado pelas rules atuais (falha no código não-corrigido)
3. **Sentimento válido mas longo**: Tentar criar com `sentimento: 'muito_feliz_hoje'` (15 chars, válido) — será rejeitado pelas rules atuais
4. **Teste it.each com sentimento extra**: Adicionar `'ansiedade'` ao `it.each` — o teste passa no hook mas a fixture não reflete a configuração real

**Expected Counterexamples**:
- Rules rejeitam qualquer sentimento que não seja exatamente `'triste'`, `'raiva'` ou `'alivio'`
- Rules rejeitam qualquer estrutura de reacoes que não tenha exatamente `apoio`, `forca` e `pouco`
- Causa confirmada: validação por lista fixa / campos específicos

### Fix Checking

**Goal**: Verificar que para todos os inputs onde o bug condition é verdadeiro, a função corrigida produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := firestoreRules_fixed(input)
  ASSERT result = ALLOW
    IF input.sentimento is string
    AND length(input.sentimento) >= 1
    AND length(input.sentimento) <= 100
    AND input.reacoes is map
    AND ALL values IN input.reacoes ARE integer >= 0
    AND input.texto is valid
    AND input.uid == auth.uid
    AND input.totalComentarios == 0
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos os inputs onde o bug condition NÃO é verdadeiro, a função corrigida produz o mesmo resultado que a original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT firestoreRules_original(input) = firestoreRules_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos test cases automaticamente cobrindo o domínio de inputs
- Captura edge cases que testes manuais podem não cobrir
- Fornece garantias fortes de que o comportamento é preservado para todos os inputs não-buggy

**Test Plan**: Observar comportamento no código NÃO-corrigido para operações com sentimentos/reações originais, depois escrever testes que garantem que esse comportamento continua após o fix.

**Test Cases**:
1. **Criação com sentimentos originais**: Verificar que `'triste'`, `'raiva'`, `'alivio'` continuam sendo aceitos pelas rules após o fix
2. **Criação com reações originais**: Verificar que `{ apoio: 0, forca: 0, pouco: 0 }` continua sendo aceito
3. **Rejeição de texto inválido**: Verificar que texto vazio ou > 2000 chars continua rejeitado
4. **Rejeição sem autenticação**: Verificar que criação sem auth continua rejeitada
5. **Imutabilidade em updates**: Verificar que `texto`, `sentimento`, `criadoEm`, `uid` continuam protegidos contra alteração

### Unit Tests

- Testar rules com sentimentos novos (strings válidas de 1-100 chars)
- Testar rules com reações novas (maps com valores inteiros >= 0)
- Testar que testes existentes passam com imports da config centralizada
- Testar edge cases: sentimento vazio, sentimento > 100 chars, reação com valor negativo

### Property-Based Tests

- Gerar strings aleatórias de 1-100 chars e verificar que são aceitas como sentimento pelas rules
- Gerar maps aleatórios com valores inteiros >= 0 e verificar que são aceitos como reações
- Gerar inputs com sentimentos/reações originais e verificar que o resultado é idêntico ao das rules originais (preservation)

### Integration Tests

- Testar fluxo completo de criação de desabafo com sentimento novo via hook → Firestore
- Testar que a página de feed exibe corretamente desabafos com sentimentos/reações dinâmicos
- Testar que a alteração na config centralizada é automaticamente refletida nos testes sem modificação manual
