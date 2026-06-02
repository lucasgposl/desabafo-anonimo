import { useState, useEffect } from 'react';
import { formatarTempoRelativo } from '../utils/tempoRelativo';

/**
 * Hook que retorna o tempo relativo formatado de uma data,
 * atualizando automaticamente a cada 60 segundos.
 *
 * Regras de formatação (delegadas a formatarTempoRelativo):
 * - diff < 60s → "agora"
 * - 60s ≤ diff < 60min → "X min atrás"
 * - 60min ≤ diff < 24h → "X h atrás"
 * - diff ≥ 24h → "dd/MM/yyyy"
 */
export function useTempoRelativo(data: Date): string {
  const [tempoRelativo, setTempoRelativo] = useState<string>(() =>
    formatarTempoRelativo(data, new Date())
  );

  useEffect(() => {
    // Atualiza imediatamente ao montar ou quando a data muda
    setTempoRelativo(formatarTempoRelativo(data, new Date()));

    // Auto-refresh a cada 60 segundos
    const intervalId = setInterval(() => {
      setTempoRelativo(formatarTempoRelativo(data, new Date()));
    }, 60_000);

    // Cleanup ao desmontar ou quando a data muda
    return () => clearInterval(intervalId);
  }, [data]);

  return tempoRelativo;
}
