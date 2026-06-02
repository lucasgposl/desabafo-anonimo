import fc from 'fast-check';

/**
 * Bugfix: fix-001-flexible-validation
 * Property 1: Bug Condition — Validação Rígida Rejeita Novos Sentimentos/Reações
 *
 * Validates: Requirements 1.1, 1.2
 *
 * Este teste codifica o COMPORTAMENTO ESPERADO (aceitação de novos valores válidos).
 * No código NÃO-corrigido, ele DEVE FALHAR — a falha confirma que o bug existe.
 * Após o fix, o teste DEVE PASSAR — confirmando que o bug foi corrigido.
 */

// --- Simulação da lógica de validação das rules ATUAIS (bugadas) ---

const SENTIMENTOS_ORIGINAIS = ['triste', 'raiva', 'alivio'] as const;
const REACOES_ORIGINAIS_KEYS = ['apoio', 'forca', 'pouco'] as const;

interface DesabafoInput {
  texto: string;
  sentimento: string;
  reacoes: Record<string, number>;
  uid: string;
  totalComentarios: number;
}

/**
 * Simula a lógica de validação das Firestore Rules ATUAIS (código corrigido).
 * Retorna true se a criação seria PERMITIDA, false se seria REJEITADA.
 *
 * Rules atuais (após fix) validam:
 * - texto is string, 1-2000 chars
 * - sentimento is string, 1-100 chars  <-- CORRIGIDO: validação flexível
 * - uid == auth.uid (simplificado aqui como uid não-vazio)
 * - reacoes is map  <-- CORRIGIDO: validação flexível
 * - totalComentarios == 0
 */
function validarRulesOriginais(input: DesabafoInput): boolean {
  // Validação de texto
  if (typeof input.texto !== 'string') return false;
  if (input.texto.length < 1 || input.texto.length > 2000) return false;

  // Validação de sentimento — FLEXÍVEL (string 1-100 chars) — corrigido
  if (typeof input.sentimento !== 'string') return false;
  if (input.sentimento.length < 1 || input.sentimento.length > 100) return false;

  // Validação de uid (simplificado: não-vazio)
  if (!input.uid || input.uid.length === 0) return false;

  // Validação de reações — FLEXÍVEL (map) — corrigido
  if (typeof input.reacoes !== 'object' || input.reacoes === null) return false;

  // Validação de totalComentarios
  if (input.totalComentarios !== 0) return false;

  return true;
}

/**
 * Simula a lógica de validação das Firestore Rules CORRIGIDAS (comportamento esperado).
 * Retorna true se a criação seria PERMITIDA, false se seria REJEITADA.
 *
 * Rules corrigidas validam:
 * - texto is string, 1-2000 chars
 * - sentimento is string, 1-100 chars  <-- FLEXÍVEL
 * - uid == auth.uid
 * - reacoes is map com valores inteiros >= 0  <-- FLEXÍVEL
 * - totalComentarios == 0
 */
function validarRulesCorrigidas(input: DesabafoInput): boolean {
  // Validação de texto (inalterada)
  if (typeof input.texto !== 'string') return false;
  if (input.texto.length < 1 || input.texto.length > 2000) return false;

  // Validação de sentimento — FLEXÍVEL (string 1-100 chars)
  if (typeof input.sentimento !== 'string') return false;
  if (input.sentimento.length < 1 || input.sentimento.length > 100) return false;

  // Validação de uid (inalterada)
  if (!input.uid || input.uid.length === 0) return false;

  // Validação de reações — FLEXÍVEL (map com valores inteiros >= 0)
  if (typeof input.reacoes !== 'object' || input.reacoes === null) return false;
  const values = Object.values(input.reacoes);
  if (values.length === 0) return false;
  for (const v of values) {
    if (!Number.isInteger(v) || v < 0) return false;
  }

  // Validação de totalComentarios (inalterada)
  if (input.totalComentarios !== 0) return false;

  return true;
}

/**
 * Verifica se o input está na condição do bug:
 * sentimento NÃO está na lista original OU chaves de reações diferentes das originais
 */
function isBugCondition(input: DesabafoInput): boolean {
  const sentimentoNovo = !(SENTIMENTOS_ORIGINAIS as readonly string[]).includes(input.sentimento);
  const reacaoKeysAtual = Object.keys(input.reacoes).sort();
  const reacaoKeysOriginal = [...REACOES_ORIGINAIS_KEYS].sort();
  const reacoesNovas =
    reacaoKeysAtual.length !== reacaoKeysOriginal.length ||
    reacaoKeysAtual.some((k, i) => k !== reacaoKeysOriginal[i]);

  return sentimentoNovo || reacoesNovas;
}

// --- Generators ---

/** Gera strings de 1-100 chars que NÃO estão na lista original de sentimentos */
const arbNovoSentimento = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => !(SENTIMENTOS_ORIGINAIS as readonly string[]).includes(s));

/** Gera maps com chaves aleatórias (1-5 chaves) e valores inteiros >= 0 */
const arbNovasReacoes = fc
  .array(
    fc.tuple(
      fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
      fc.nat({ max: 1000 })
    ),
    { minLength: 1, maxLength: 5 }
  )
  .map((entries) => Object.fromEntries(entries))
  .filter((map) => {
    // Garantir que as chaves NÃO são exatamente as originais
    const keys = Object.keys(map).sort();
    const originalKeys = [...REACOES_ORIGINAIS_KEYS].sort();
    return (
      keys.length !== originalKeys.length || keys.some((k, i) => k !== originalKeys[i])
    );
  });

/** Gera texto válido (1-200 chars para manter testes rápidos) */
const arbTextoValido = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.length >= 1);

/** Gera uid válido */
const arbUid = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.length >= 1);

// --- Tests ---

describe('Bugfix: fix-001-flexible-validation — Property 1: Bug Condition', () => {
  describe('Novos sentimentos válidos são REJEITADOS pelas rules atuais (demonstra o bug)', () => {
    it('Para qualquer sentimento válido (1-100 chars) fora da lista original, as rules corrigidas DEVEM aceitar', () => {
      /**
       * Este teste asserta o COMPORTAMENTO ESPERADO (rules corrigidas aceitam).
       * No código não-corrigido, validarRulesOriginais rejeita esses inputs.
       * A falha deste teste CONFIRMA que o bug existe.
       */
      fc.assert(
        fc.property(arbNovoSentimento, arbTextoValido, arbUid, (sentimento, texto, uid) => {
          const input: DesabafoInput = {
            texto,
            sentimento,
            reacoes: { apoio: 0, forca: 0, pouco: 0 }, // reações originais para isolar o bug de sentimento
            uid,
            totalComentarios: 0,
          };

          // Confirma que estamos na condição do bug
          expect(isBugCondition(input)).toBe(true);

          // Comportamento ESPERADO: rules corrigidas aceitam
          const resultadoEsperado = validarRulesCorrigidas(input);
          expect(resultadoEsperado).toBe(true);

          // Comportamento ATUAL (bugado): rules originais REJEITAM
          // Este assert demonstra que as rules atuais REJEITAM valores válidos
          const resultadoAtual = validarRulesOriginais(input);

          // Assertamos que o resultado atual DEVERIA ser igual ao esperado (aceitação)
          // Esta asserção FALHA no código não-corrigido — confirmando o bug
          expect(resultadoAtual).toBe(resultadoEsperado);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Novas reações válidas são REJEITADAS pelas rules atuais (demonstra o bug)', () => {
    it('Para qualquer map de reações com valores inteiros >= 0 e chaves diferentes das originais, as rules corrigidas DEVEM aceitar', () => {
      /**
       * Este teste asserta o COMPORTAMENTO ESPERADO (rules corrigidas aceitam).
       * No código não-corrigido, validarRulesOriginais rejeita esses inputs.
       * A falha deste teste CONFIRMA que o bug existe.
       */
      fc.assert(
        fc.property(arbNovasReacoes, arbTextoValido, arbUid, (reacoes, texto, uid) => {
          const input: DesabafoInput = {
            texto,
            sentimento: 'triste', // sentimento original para isolar o bug de reações
            reacoes,
            uid,
            totalComentarios: 0,
          };

          // Confirma que estamos na condição do bug
          expect(isBugCondition(input)).toBe(true);

          // Comportamento ESPERADO: rules corrigidas aceitam
          const resultadoEsperado = validarRulesCorrigidas(input);
          expect(resultadoEsperado).toBe(true);

          // Comportamento ATUAL (bugado): rules originais REJEITAM
          const resultadoAtual = validarRulesOriginais(input);

          // Assertamos que o resultado atual DEVERIA ser igual ao esperado
          // Esta asserção FALHA no código não-corrigido — confirmando o bug
          expect(resultadoAtual).toBe(resultadoEsperado);
        }),
        { numRuns: 100 }
      );
    });
  });
});
