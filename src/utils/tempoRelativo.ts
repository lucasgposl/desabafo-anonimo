/**
 * Função pura para formatar tempo relativo entre duas datas.
 *
 * Regras:
 * - diff < 60 segundos → "agora"
 * - 60 ≤ diff < 3600 segundos → "{minutos} min atrás"
 * - 3600 ≤ diff < 86400 segundos → "{horas} h atrás"
 * - diff ≥ 86400 segundos → data formatada como dd/MM/yyyy
 */
export function formatarTempoRelativo(data: Date, agora: Date): string {
  const diffMs = agora.getTime() - data.getTime();
  const diffSegundos = Math.floor(diffMs / 1000);

  if (diffSegundos < 60) {
    return 'agora';
  }

  if (diffSegundos < 3600) {
    const minutos = Math.floor(diffSegundos / 60);
    return `${minutos} min atrás`;
  }

  if (diffSegundos < 86400) {
    const horas = Math.floor(diffSegundos / 3600);
    return `${horas} h atrás`;
  }

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}
