import { useState, useCallback } from 'react';
import { InputBoxProps, Sentimento } from '../types';
import './InputBox.css';

const SENTIMENTO_PADRAO: Sentimento = 'triste';
const MAX_CARACTERES = 2000;

const SENTIMENTOS: { valor: Sentimento; icone: string; label: string }[] = [
  { valor: 'triste', icone: '😢', label: 'Tristeza' },
  { valor: 'raiva', icone: '😤', label: 'Raiva' },
  { valor: 'alivio', icone: '😌', label: 'Alívio' },
];

export function InputBox({ onPublicar, isPublicando }: InputBoxProps) {
  const [texto, setTexto] = useState('');
  const [sentimento, setSentimento] = useState<Sentimento>(SENTIMENTO_PADRAO);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

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

    try {
      await onPublicar(texto, sentimento);
      setTexto('');
      setSentimento(SENTIMENTO_PADRAO);
      mostrarFeedback('sucesso', 'Seu desabafo foi publicado. Você não está sozinho(a). 💜');
    } catch {
      mostrarFeedback('erro', 'Erro ao publicar. Tente novamente.');
    }
  };

  return (
    <div className="input-box">
      <textarea
        className="input-box__textarea"
        placeholder="O que você está sentindo? Este é um espaço seguro para se expressar..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={isPublicando}
        maxLength={MAX_CARACTERES}
        aria-label="Texto do desabafo"
      />

      <div className="input-box__controles">
        <div className="input-box__sentimentos" role="radiogroup" aria-label="Sentimento">
          {SENTIMENTOS.map((s) => (
            <button
              key={s.valor}
              type="button"
              className={`input-box__sentimento-btn ${sentimento === s.valor ? 'input-box__sentimento-btn--ativo' : ''}`}
              onClick={() => setSentimento(s.valor)}
              disabled={isPublicando}
              aria-pressed={sentimento === s.valor}
              aria-label={s.label}
              title={s.label}
            >
              <span className="input-box__sentimento-icone">{s.icone}</span>
              <span className="input-box__sentimento-label">{s.label}</span>
            </button>
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
