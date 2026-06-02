import fc from 'fast-check';

/**
 * Bugfix: fix-001-flexible-validation, Property 2: Preservation
 * Comportamento Existente com Valores Originais
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 *
 * Metodologia observation-first:
 * - Observar que as rules ACEITAM inputs com sentimentos originais + reações originais + texto válido + auth
 * - Observar que as rules REJEITAM texto vazio ou > 2000 chars
 * - Observar que as rules REJEITAM criação sem autenticação
 * - Observar que rules de update protegem imutabilidade de texto, sentimento, criadoEm, uid
 */

// --- Simulação da lógica de validação das Firestore Rules atuais ---

const SENTIMENTOS_ORIGINAIS = ['triste', 'raiva', 'alivio'] as const;

interface DesabafoInput {
  texto: string;
  sentimento: string;
  reacoes: Record<string, number>;
  uid: string;
  totalComentarios: number;
}

interface AuthContext {
  uid: string | null; // null = não autenticado
}

interface UpdateInput {
  antes: {
    texto: string;
    sentimento: string;
    criadoEm: string;
    uid: string;
  };
  depois: {
    texto: string;
    sentimento: string;
    criadoEm: string;
    uid: string;
  };
}

/**
 * Simula a lógica de validação de CRIAÇÃO das rules atuais (não-corrigidas).
 * Retorna true se a criação é ACEITA, false se REJEITADA.
 */
function validarCriacaoRulesOriginais(input: DesabafoInput, auth: AuthContext): boolean {
  // isAuthenticated()
  if (auth.uid === null) return false;

  // request.resource.data.texto is string && size >= 1 && size <= 2000
  if (typeof input.texto !== 'string') return false;
  if (input.texto.length < 1 || input.texto.length > 2000) return false;

  // request.resource.data.sentimento in ['triste', 'raiva', 'alivio']
  if (!SENTIMENTOS_ORIGINAIS.includes(input.sentimento as any)) return false;

  // request.resource.data.uid == request.auth.uid
  if (input.uid !== auth.uid) return false;

  // request.resource.data.reacoes.apoio == 0 && .forca == 0 && .pouco == 0
  if (input.reacoes.apoio !== 0) return false;
  if (input.reacoes.forca !== 0) return false;
  if (input.reacoes.pouco !== 0) return false;

  // request.resource.data.totalComentarios == 0
  if (input.totalComentarios !== 0) return false;

  return true;
}

/**
 * Simula a lógica de validação de UPDATE das rules atuais.
 * Retorna true se o update é ACEITO (campos imutáveis não mudaram).
 */
function validarUpdateRulesOriginais(update: UpdateInput): boolean {
  // texto, sentimento, criadoEm, uid devem permanecer iguais
  if (update.depois.texto !== update.antes.texto) return false;
  if (update.depois.sentimento !== update.antes.sentimento) return false;
  if (update.depois.criadoEm !== update.antes.criadoEm) return false;
  if (update.depois.uid !== update.antes.uid) return false;

  return true;
}

// --- Bug Condition (para filtrar inputs que NÃO são bug condition) ---

function isBugCondition(input: { sentimento: string; reacoes: Record<string, number> }): boolean {
  const sentimentoFora = !SENTIMENTOS_ORIGINAIS.includes(input.sentimento as any);
  const chaves = Object.keys(input.reacoes).sort();
  const chavesOriginais = ['apoio', 'forca', 'pouco'].sort();
  const reacoesDiferentes =
    chaves.length !== chavesOriginais.length ||
    chaves.some((k, i) => k !== chavesOriginais[i]);

  return sentimentoFora || reacoesDiferentes;
}

// --- Generators ---

/** Gera texto válido de 1 a 2000 caracteres */
const textoValidoArb = fc.string({ minLength: 1, maxLength: 2000 });

/** Gera texto inválido: vazio ou > 2000 chars */
const textoInvalidoArb = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 2001, maxLength: 2100 })
);

/** Gera um sentimento original aleatório */
const sentimentoOriginalArb = fc.constantFrom(...SENTIMENTOS_ORIGINAIS);

/** Gera reações originais (todas zeradas) */
const reacoesOriginaisArb = fc.constant({ apoio: 0, forca: 0, pouco: 0 });

/** Gera um UID aleatório não-vazio */
const uidArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.length > 0);

// --- Property Tests ---

describe('Bugfix: fix-001-flexible-validation, Property 2: Preservation', () => {
  describe('Criação com sentimentos e reações originais', () => {
    it('ACEITA criação com texto válido (1-2000 chars), sentimento original, reações originais, auth válido', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          sentimentoOriginalArb,
          reacoesOriginaisArb,
          uidArb,
          (texto, sentimento, reacoes, uid) => {
            const input: DesabafoInput = {
              texto,
              sentimento,
              reacoes,
              uid,
              totalComentarios: 0,
            };
            const auth: AuthContext = { uid };

            // Estes inputs NÃO são bug condition
            expect(isBugCondition({ sentimento, reacoes })).toBe(false);

            // Rules originais DEVEM aceitar
            const resultado = validarCriacaoRulesOriginais(input, auth);
            expect(resultado).toBe(true);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('REJEITA criação com texto vazio ou > 2000 chars mesmo com sentimento e reações originais', () => {
      fc.assert(
        fc.property(
          textoInvalidoArb,
          sentimentoOriginalArb,
          reacoesOriginaisArb,
          uidArb,
          (texto, sentimento, reacoes, uid) => {
            const input: DesabafoInput = {
              texto,
              sentimento,
              reacoes,
              uid,
              totalComentarios: 0,
            };
            const auth: AuthContext = { uid };

            // Rules originais DEVEM rejeitar (texto inválido)
            const resultado = validarCriacaoRulesOriginais(input, auth);
            expect(resultado).toBe(false);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('REJEITA criação sem autenticação mesmo com todos os outros campos válidos', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          sentimentoOriginalArb,
          reacoesOriginaisArb,
          uidArb,
          (texto, sentimento, reacoes, uid) => {
            const input: DesabafoInput = {
              texto,
              sentimento,
              reacoes,
              uid,
              totalComentarios: 0,
            };
            // Auth com uid null = não autenticado
            const auth: AuthContext = { uid: null };

            // Rules originais DEVEM rejeitar (sem auth)
            const resultado = validarCriacaoRulesOriginais(input, auth);
            expect(resultado).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('REJEITA criação quando uid do input não corresponde ao uid do auth', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          sentimentoOriginalArb,
          reacoesOriginaisArb,
          uidArb,
          uidArb,
          (texto, sentimento, reacoes, inputUid, authUid) => {
            // Garante que são diferentes
            fc.pre(inputUid !== authUid);

            const input: DesabafoInput = {
              texto,
              sentimento,
              reacoes,
              uid: inputUid,
              totalComentarios: 0,
            };
            const auth: AuthContext = { uid: authUid };

            // Rules originais DEVEM rejeitar (uid mismatch)
            const resultado = validarCriacaoRulesOriginais(input, auth);
            expect(resultado).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('REJEITA criação quando totalComentarios != 0', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          sentimentoOriginalArb,
          reacoesOriginaisArb,
          uidArb,
          fc.integer({ min: 1, max: 1000 }),
          (texto, sentimento, reacoes, uid, totalComentarios) => {
            const input: DesabafoInput = {
              texto,
              sentimento,
              reacoes,
              uid,
              totalComentarios,
            };
            const auth: AuthContext = { uid };

            // Rules originais DEVEM rejeitar (totalComentarios != 0)
            const resultado = validarCriacaoRulesOriginais(input, auth);
            expect(resultado).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Imutabilidade em updates', () => {
    it('ACEITA update quando texto, sentimento, criadoEm e uid não mudam', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          sentimentoOriginalArb,
          fc.string({ minLength: 1, maxLength: 30 }),
          uidArb,
          (texto, sentimento, criadoEm, uid) => {
            const update: UpdateInput = {
              antes: { texto, sentimento, criadoEm, uid },
              depois: { texto, sentimento, criadoEm, uid },
            };

            // Rules originais DEVEM aceitar (nada mudou nos campos protegidos)
            const resultado = validarUpdateRulesOriginais(update);
            expect(resultado).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('REJEITA update quando texto muda', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          textoValidoArb,
          sentimentoOriginalArb,
          fc.string({ minLength: 1, maxLength: 30 }),
          uidArb,
          (textoAntes, textoDepois, sentimento, criadoEm, uid) => {
            fc.pre(textoAntes !== textoDepois);

            const update: UpdateInput = {
              antes: { texto: textoAntes, sentimento, criadoEm, uid },
              depois: { texto: textoDepois, sentimento, criadoEm, uid },
            };

            const resultado = validarUpdateRulesOriginais(update);
            expect(resultado).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('REJEITA update quando sentimento muda', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          sentimentoOriginalArb,
          sentimentoOriginalArb,
          fc.string({ minLength: 1, maxLength: 30 }),
          uidArb,
          (texto, sentAntes, sentDepois, criadoEm, uid) => {
            fc.pre(sentAntes !== sentDepois);

            const update: UpdateInput = {
              antes: { texto, sentimento: sentAntes, criadoEm, uid },
              depois: { texto, sentimento: sentDepois, criadoEm, uid },
            };

            const resultado = validarUpdateRulesOriginais(update);
            expect(resultado).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('REJEITA update quando criadoEm muda', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          sentimentoOriginalArb,
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          uidArb,
          (texto, sentimento, criadoAntes, criadoDepois, uid) => {
            fc.pre(criadoAntes !== criadoDepois);

            const update: UpdateInput = {
              antes: { texto, sentimento, criadoEm: criadoAntes, uid },
              depois: { texto, sentimento, criadoEm: criadoDepois, uid },
            };

            const resultado = validarUpdateRulesOriginais(update);
            expect(resultado).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('REJEITA update quando uid muda', () => {
      fc.assert(
        fc.property(
          textoValidoArb,
          sentimentoOriginalArb,
          fc.string({ minLength: 1, maxLength: 30 }),
          uidArb,
          uidArb,
          (texto, sentimento, criadoEm, uidAntes, uidDepois) => {
            fc.pre(uidAntes !== uidDepois);

            const update: UpdateInput = {
              antes: { texto, sentimento, criadoEm, uid: uidAntes },
              depois: { texto, sentimento, criadoEm, uid: uidDepois },
            };

            const resultado = validarUpdateRulesOriginais(update);
            expect(resultado).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
