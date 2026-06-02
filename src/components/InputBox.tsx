import { useState, useCallback, useRef } from 'react';
import { InputBoxProps, Sentimento } from '../types';
import { SENTIMENTO_CONFIG, sentimentosPorCategoria, CATEGORIAS } from '../config/sentimentos';
import { EMOJIS_EXPANDIDOS } from '../constants/emojis';
import './InputBox.css';

export interface EmojiItem {
  char: string;
  label: string;
}

export function inserirEmojiNoTexto(
  texto: string,
  emoji: string,
  cursorPos: number,
  maxCaracteres: number
): { novoTexto: string; novaPosicao: number } | null {
  if (texto.length + emoji.length > maxCaracteres) {
    return null;
  }

  const novoTexto = texto.slice(0, cursorPos) + emoji + texto.slice(cursorPos);
  const novaPosicao = cursorPos + emoji.length;

  return { novoTexto, novaPosicao };
}

const MAX_CARACTERES = 2000;

// Backwards compatibility: testes existentes importam EMOJIS daqui
export const EMOJIS = EMOJIS_EXPANDIDOS;

export function InputBox({ onPublicar, isPublicando }: InputBoxProps) {
  const [texto, setTexto] = useState('');
  const [sentimento, setSentimento] = useState<Sentimento | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inserirEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea?.selectionStart ?? texto.length;

    const resultado = inserirEmojiNoTexto(texto, emoji, cursorPos, MAX_CARACTERES);
    if (!resultado) return;

    setTexto(resultado.novoTexto);

    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = resultado.novaPosicao;
        textarea.selectionEnd = resultado.novaPosicao;
      }
    });
  };

  const mostrarFeedback = useCallback((tipo: 'sucesso' | 'erro', mensagem: string) => {
    setFeedback({ tipo, mensagem });
    if (tipo === 'sucesso') {
      setTimeout(() => setFeedback(null), 3000);
    }
  }, []);

  const limparFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const handlePublicar = async () => {
    limparFeedback();

    const textoTrimmed = texto.trim();

    if (!textoTrimmed) {
      mostrarFeedback('erro', 'Escreva algo antes de publicar!');
      return;
    }

    if (texto.length > MAX_CARACTERES) {
      mostrarFeedback('erro', `O texto deve ter no máximo ${MAX_CARACTERES} caracteres.`);
      return;
    }

    if (!sentimento) {
      mostrarFeedback('erro', 'Selecione um sentimento antes de publicar!');
      return;
    }

    try {
      await onPublicar(texto, sentimento);
      setTexto('');
      setSentimento(null);
      mostrarFeedback('sucesso', 'Seu desabafo foi publicado. Você não está sozinho(a). 💜');
    } catch {
      mostrarFeedback('erro', 'Erro ao publicar. Tente novamente.');
    }
  };

  return (
    <div className="input-box">
      <textarea
        ref={textareaRef}
        className="input-box__textarea"
        placeholder="O que você está sentindo? Este é um espaço seguro para se expressar..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={isPublicando}
        maxLength={MAX_CARACTERES}
        aria-label="Texto do desabafo"
      />

      <div className="input-box__emoji-bar" role="toolbar" aria-label="Emojis">
        {EMOJIS_EXPANDIDOS.map((emoji) => (
          <button
            key={emoji.char}
            type="button"
            className="input-box__emoji-btn"
            onClick={() => inserirEmoji(emoji.char)}
            disabled={isPublicando}
            aria-label={emoji.label}
            title={emoji.label}
          >
            {emoji.char}
          </button>
        ))}
      </div>

      <div className="input-box__controles">
        <div className="input-box__sentimentos" role="radiogroup" aria-label="Sentimento">
          {Object.entries(sentimentosPorCategoria()).map(([cat, chaves]) => (
            <div key={cat} className="input-box__sentimento-grupo">
              <span className="input-box__sentimento-categoria">{CATEGORIAS[cat as keyof typeof CATEGORIAS]}</span>
              {chaves.map((chave) => {
                const entry = SENTIMENTO_CONFIG[chave];
                return (
                  <button
                    key={chave}
                    type="button"
                    className={`input-box__sentimento-btn ${sentimento === chave ? 'input-box__sentimento-btn--ativo' : ''}`}
                    onClick={() => setSentimento(chave)}
                    disabled={isPublicando}
                    aria-pressed={sentimento === chave}
                    aria-label={entry.label}
                    title={entry.label}
                  >
                    <span className="input-box__sentimento-icone">{entry.emoji}</span>
                    <span className="input-box__sentimento-label">{entry.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <button
          className="input-box__botao"
          onClick={handlePublicar}
          disabled={isPublicando}
          aria-busy={isPublicando}
        >
          {isPublicando ? (
            <>
              <span className="input-box__loading-indicator" aria-hidden="true" />
              Publicando...
            </>
          ) : (
            'Publicar'
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`input-box__feedback input-box__feedback--${feedback.tipo}`}
          role={feedback.tipo === 'erro' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback.mensagem}
        </div>
      )}
    </div>
  );
}
