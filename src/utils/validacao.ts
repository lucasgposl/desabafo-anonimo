/**
 * Funções utilitárias de validação para desabafos e comentários.
 */

export interface ResultadoValidacao {
  valido: boolean;
  erro?: string;
}

/**
 * Valida o texto de um desabafo.
 * - Rejeita strings vazias
 * - Rejeita strings compostas apenas de espaços em branco
 * - Rejeita strings com mais de 2000 caracteres
 */
export function validarTextoDesabafo(texto: string): ResultadoValidacao {
  if (texto.trim().length === 0) {
    return { valido: false, erro: 'Escreva algo antes de publicar!' };
  }

  if (texto.length > 2000) {
    return { valido: false, erro: 'O texto deve ter no máximo 2000 caracteres.' };
  }

  return { valido: true };
}

/**
 * Valida o texto de um comentário.
 * - Rejeita strings vazias
 * - Rejeita strings compostas apenas de espaços em branco
 * - Rejeita strings com mais de 500 caracteres
 */
export function validarTextoComentario(texto: string): ResultadoValidacao {
  if (texto.trim().length === 0) {
    return { valido: false, erro: 'Escreva algo antes de publicar!' };
  }

  if (texto.length > 500) {
    return { valido: false, erro: 'O comentário deve ter no máximo 500 caracteres.' };
  }

  return { valido: true };
}
