# Bugfix Requirements Document

## Introduction

O projeto atualmente possui regras do Firestore e testes unitários que validam sentimentos e reações contra listas hardcoded de valores específicos (`'triste'`, `'raiva'`, `'alivio'` para sentimentos; `'apoio'`, `'forca'`, `'pouco'` para reações). Isso cria um acoplamento rígido: qualquer alteração nos sentimentos ou reações disponíveis exige redeploy das regras do Firestore e modificação manual de múltiplos arquivos de teste, gerando carga de manutenção desnecessária e risco de inconsistência.

Este bugfix visa tornar as regras do Firestore genéricas (validação por tipo/formato em vez de lista fixa) e adaptar os testes para importar valores de fixture a partir da configuração centralizada, eliminando a necessidade de alterar múltiplos arquivos quando sentimentos ou reações mudam.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN um desenvolvedor adiciona um novo sentimento ao sistema THEN as regras do Firestore (`firestore.rules`) rejeitam a criação de desabafos com esse sentimento porque a validação usa `request.resource.data.sentimento in ['triste', 'raiva', 'alivio']` (lista fixa hardcoded).

1.2 WHEN um desenvolvedor adiciona uma nova reação ao sistema THEN as regras do Firestore rejeitam a criação de desabafos porque a validação exige campos específicos (`request.resource.data.reacoes.apoio == 0 && request.resource.data.reacoes.forca == 0 && request.resource.data.reacoes.pouco == 0`), não aceitando uma estrutura diferente.

1.3 WHEN o conjunto de sentimentos é alterado THEN os testes `usePublicar.test.ts`, `useDesabafo.test.ts`, `useDesabafos.test.ts`, `useReacoes.test.ts` e `trends.test.ts` falham porque usam literais hardcoded (`sentimento: 'triste'`, `it.each(['triste', 'raiva', 'alivio'])`) que não refletem a nova configuração.

1.4 WHEN o conjunto de reações é alterado THEN os testes que usam fixtures com `reacoes: { apoio: 0, forca: 0, pouco: 0 }` falham porque as chaves hardcoded não correspondem mais à estrutura esperada.

### Expected Behavior (Correct)

2.1 WHEN um desabafo é criado com qualquer string não-vazia de até 100 caracteres no campo `sentimento` THEN as regras do Firestore SHALL aceitar a criação, validando apenas que o campo é uma string com tamanho entre 1 e 100 caracteres.

2.2 WHEN um desabafo é criado com o campo `reacoes` sendo um map cujos valores são todos inteiros >= 0 THEN as regras do Firestore SHALL aceitar a criação, validando apenas o tipo e formato do campo (map com valores inteiros não-negativos), sem verificar chaves específicas.

2.3 WHEN o conjunto de sentimentos é alterado na configuração centralizada THEN os testes SHALL continuar passando sem modificações, pois importam valores de fixture diretamente da configuração (`SENTIMENTO_CONFIG` / `REACAO_CONFIG`).

2.4 WHEN o conjunto de reações é alterado na configuração centralizada THEN os testes SHALL continuar passando sem modificações, pois constroem o objeto `reacoes` dinamicamente a partir das chaves exportadas pela configuração.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN um desabafo é criado com texto válido (1-2000 caracteres), uid do autor autenticado e totalComentarios == 0 THEN as regras do Firestore SHALL CONTINUE TO permitir a criação.

3.2 WHEN um desabafo é criado por um usuário não-autenticado THEN as regras do Firestore SHALL CONTINUE TO rejeitar a criação.

3.3 WHEN um desabafo é criado com texto vazio ou maior que 2000 caracteres THEN as regras do Firestore SHALL CONTINUE TO rejeitar a criação.

3.4 WHEN um desabafo é atualizado THEN as regras do Firestore SHALL CONTINUE TO impedir alteração dos campos `texto`, `sentimento`, `criadoEm` e `uid`.

3.5 WHEN os testes de publicação validam texto vazio, texto longo ou erros de rede THEN os testes SHALL CONTINUE TO passar com o mesmo comportamento.

3.6 WHEN os testes de reações validam optimistic update, rollback em falha e múltiplas reações THEN os testes SHALL CONTINUE TO passar com o mesmo comportamento.

3.7 WHEN os testes de trends calculam total de interações e ordenação por popularidade THEN os testes SHALL CONTINUE TO passar com o mesmo comportamento.

---

## Bug Condition (Formal)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type { sentimento: string, reacoes: Map<string, number> }
  OUTPUT: boolean
  
  // O bug se manifesta quando o sentimento ou as chaves de reação
  // não estão na lista hardcoded atual das rules/tests
  RETURN X.sentimento NOT IN ['triste', 'raiva', 'alivio']
      OR keys(X.reacoes) != {'apoio', 'forca', 'pouco'}
END FUNCTION
```

```pascal
// Property: Fix Checking — Validação flexível aceita novos valores
FOR ALL X WHERE isBugCondition(X) DO
  result ← firestoreRules'(X)
  ASSERT result = ALLOW
    IF X.sentimento is string
    AND length(X.sentimento) >= 1
    AND length(X.sentimento) <= 100
    AND ALL values IN X.reacoes ARE integer >= 0
END FOR
```

```pascal
// Property: Preservation Checking — Valores existentes continuam válidos
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT firestoreRules(X) = firestoreRules'(X)
END FOR
```
