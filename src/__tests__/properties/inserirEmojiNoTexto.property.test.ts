import fc from 'fast-check';
import { inserirEmojiNoTexto, EMOJIS } from '../../components/InputBox';

const MAX_CARACTERES = 2000;

/**
 * Feature: enhance-003-emoji-picker, Property 1: Emoji insertion preserves surrounding text and places emoji at cursor
 *
 * Validates: Requirements 2.1, 2.2, 2.3
 */
describe('Feature: enhance-003-emoji-picker, Property 1: Emoji insertion preserves surrounding text and places emoji at cursor', () => {
  it('inserirEmojiNoTexto produces text.slice(0, cursor) + emoji + text.slice(cursor) and correct cursor position', () => {
    const emojiChars = EMOJIS.map((e) => e.char);

    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1990 }),
        fc.nat(),
        fc.constantFrom(...emojiChars),
        (texto, rawCursor, emoji) => {
          // Constrain cursor to valid range [0, texto.length]
          const cursor = rawCursor % (texto.length + 1);

          // Only test cases where insertion is within the character limit
          fc.pre(texto.length + emoji.length <= MAX_CARACTERES);

          const resultado = inserirEmojiNoTexto(texto, emoji, cursor, MAX_CARACTERES);

          // Should not be null since we're within the limit
          expect(resultado).not.toBeNull();

          const expected = texto.slice(0, cursor) + emoji + texto.slice(cursor);
          expect(resultado!.novoTexto).toBe(expected);
          expect(resultado!.novaPosicao).toBe(cursor + emoji.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: enhance-003-emoji-picker, Property 2: Character limit enforcement on emoji insertion
 *
 * Validates: Requirements 2.5
 */
describe('Feature: enhance-003-emoji-picker, Property 2: Character limit enforcement on emoji insertion', () => {
  it('returns null when text.length + emoji.length > MAX_CARACTERES, and succeeds otherwise', () => {
    const emojiChars = EMOJIS.map((e) => e.char);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1990, maxLength: 2000 }),
        fc.constantFrom(...emojiChars),
        fc.nat(),
        (texto, emoji, rawCursor) => {
          // Constrain cursor to valid range [0, texto.length]
          const cursor = rawCursor % (texto.length + 1);

          const resultado = inserirEmojiNoTexto(texto, emoji, cursor, MAX_CARACTERES);

          if (texto.length + emoji.length > MAX_CARACTERES) {
            // Should be rejected — text unchanged
            expect(resultado).toBeNull();
          } else {
            // Should succeed with correct insertion
            expect(resultado).not.toBeNull();
            const expected = texto.slice(0, cursor) + emoji + texto.slice(cursor);
            expect(resultado!.novoTexto).toBe(expected);
            expect(resultado!.novaPosicao).toBe(cursor + emoji.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
