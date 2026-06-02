import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import { EMOJIS, InputBox } from '../../components/InputBox';

/**
 * Feature: enhance-003-emoji-picker, Property 3: Every emoji in the set renders a button with correct aria-label
 *
 * Validates: Requirements 3.3, 4.3
 */
describe('Feature: enhance-003-emoji-picker, Property 3: Every emoji in the set renders a button with correct aria-label', () => {
  const mockOnPublicar = jest.fn().mockResolvedValue(undefined);

  it('every emoji in the EMOJIS array renders a button with aria-label equal to label and text content equal to char', () => {
    render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);

    const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });

    fc.assert(
      fc.property(
        fc.constantFrom(...EMOJIS),
        (emoji) => {
          const button = within(toolbar).getByRole('button', { name: emoji.label });

          expect(button).toBeInTheDocument();
          expect(button).toHaveAttribute('aria-label', emoji.label);
          expect(button.textContent).toBe(emoji.char);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a random subset of EMOJIS all render correctly within the toolbar', () => {
    render(<InputBox onPublicar={mockOnPublicar} isPublicando={false} />);

    const toolbar = screen.getByRole('toolbar', { name: 'Emojis' });

    fc.assert(
      fc.property(
        fc.shuffledSubarray(EMOJIS, { minLength: 1 }),
        (subset) => {
          for (const emoji of subset) {
            const button = within(toolbar).getByRole('button', { name: emoji.label });

            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('aria-label', emoji.label);
            expect(button.textContent).toBe(emoji.char);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
