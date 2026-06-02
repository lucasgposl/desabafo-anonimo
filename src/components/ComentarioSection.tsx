import { useState, useCallback, useEffect, useRef } from 'react';
import { ComentarioSectionProps, Comentario } from '../types';
import { buscarComentarios, criarComentario } from '../firebase/comentarios';
import { EMOJIS_EXPANDIDOS } from '../constants/emojis';
import { inserirEmojiNoTexto } from './InputBox';
import './ComentarioSection.css';

const MAX_CARACTERES_COMENTARIO = 500;

function formatarTempoRelativo(data: Date): string {
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffSegundos = Math.floor(diffMs / 1000);

  if (diffSegundos < 60) {
    return 'agora';
  }

  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) {
    return `${diffMinutos} min atrás`;
  }

  const diffHoras = Math.floor(diffSegundos / 3600);
  if (diffHoras < 24) {
    return `${diffHoras} h atrás`;
  }

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function ComentarioSection({ desabafoId, usuarioAutenticado, uid, limite, mostrarFormulario = true }: ComentarioSectionProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [isPublicando, setIsPublicando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inserirEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea?.selectionStart ?? texto.length;

    const resultado = inserirEmojiNoTexto(texto, emoji, cursorPos, MAX_CARACTERES_COMENTARIO);
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

  // Carregar comentários do Firestore na montagem
  useEffect(() => {
    let cancelado = false;
    setIsLoading(true);

    buscarComentarios(desabafoId, limite ?? 10000)
      .then((resultado) => {
        if (!cancelado) {
          setComentarios(resultado);
        }
      })
      .catch(() => {
        // Silenciar erro de carregamento de comentários
      })
      .finally(() => {
        if (!cancelado) {
          setIsLoading(false);
        }
      });

    return () => { cancelado = true; };
  }, [desabafoId, limite]);

  const handleSubmeter = async () => {
    setFeedback(null);

    const textoTrimmed = texto.trim();

    if (!textoTrimmed) {
      mostrarFeedback('erro', 'Escreva algo antes de comentar!');
      return;
    }

    if (texto.length > MAX_CARACTERES_COMENTARIO) {
      mostrarFeedback('erro', `O comentário deve ter no máximo ${MAX_CARACTERES_COMENTARIO} caracteres.`);
      return;
    }

    if (!uid) {
      mostrarFeedback('erro', 'Faça login para comentar.');
      return;
    }

    setIsPublicando(true);

    try {
      const novoId = await criarComentario(desabafoId, textoTrimmed, uid);
      const novoComentario: Comentario = {
        id: novoId,
        texto: textoTrimmed,
        criadoEm: new Date(),
        desabafoId,
      };
      setComentarios((prev) => [...prev, novoComentario]);
      setTexto('');
      mostrarFeedback('sucesso', 'Comentário publicado!');
    } catch {
      mostrarFeedback('erro', 'Erro ao publicar comentário. Tente novamente.');
    } finally {
      setIsPublicando(false);
    }
  };

  const caracteresRestantes = MAX_CARACTERES_COMENTARIO - texto.length;

  return (
    <section className="comentario-section" aria-label="Seção de comentários">
      <div className="comentario-section__conteudo">
        {isLoading ? (
          <div className="comentario-section__loading" role="status" aria-live="polite">
            <span className="comentario-section__loading-indicator" aria-hidden="true" />
            Carregando comentários...
          </div>
        ) : (
          <>
            {comentarios.length === 0 ? (
              <p className="comentario-section__vazio">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            ) : (
              <ul className="comentario-section__lista" aria-label="Lista de comentários">
                {comentarios.map((comentario) => (
                  <li key={comentario.id} className="comentario-section__item">
                    <p className="comentario-section__item-texto">{comentario.texto}</p>
                    <span className="comentario-section__item-tempo">
                      {formatarTempoRelativo(comentario.criadoEm)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {mostrarFormulario && (
              usuarioAutenticado ? (
                <div className="comentario-section__formulario">
                  <textarea
                    ref={textareaRef}
                    className="comentario-section__textarea"
                    placeholder="Escreva um comentário de apoio..."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    disabled={isPublicando}
                    maxLength={MAX_CARACTERES_COMENTARIO}
                    aria-label="Texto do comentário"
                  />
                  <div className="comentario-section__emoji-bar" role="toolbar" aria-label="Emojis">
                    {EMOJIS_EXPANDIDOS.map((emoji) => (
                      <button
                        key={emoji.char}
                        type="button"
                        className="comentario-section__emoji-btn"
                        onClick={() => inserirEmoji(emoji.char)}
                        disabled={isPublicando}
                        aria-label={emoji.label}
                        title={emoji.label}
                      >
                        {emoji.char}
                      </button>
                    ))}
                  </div>
                  <div className="comentario-section__controles">
                    <span
                      className={`comentario-section__contador ${
                        caracteresRestantes < 50 ? 'comentario-section__contador--alerta' : ''
                      }`}
                      aria-live="polite"
                    >
                      {caracteresRestantes} caracteres restantes
                    </span>
                    <button
                      className="comentario-section__botao-enviar"
                      onClick={handleSubmeter}
                      disabled={isPublicando}
                      aria-busy={isPublicando}
                    >
                      {isPublicando ? (
                        <>
                          <span className="comentario-section__btn-loading" aria-hidden="true" />
                          Enviando...
                        </>
                      ) : (
                        'Comentar'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="comentario-section__login-msg" role="status">
                  <p className="comentario-section__login-msg-texto">
                    Faça login para comentar.
                  </p>
                </div>
              )
            )}

            {feedback && (
              <div
                className={`comentario-section__feedback comentario-section__feedback--${feedback.tipo}`}
                role={feedback.tipo === 'erro' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {feedback.mensagem}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
