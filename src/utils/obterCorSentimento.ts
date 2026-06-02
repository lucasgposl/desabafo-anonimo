import { SENTIMENTO_CONFIG, CategoriaSentimento } from '../config/sentimentos';

const CORES_CATEGORIA: Record<CategoriaSentimento, string> = {
  dramas: 'var(--cor-dramas)',
  good_vibes: 'var(--cor-good-vibes)',
};

const COR_LEGADO = 'var(--cor-neutro)';

/**
 * Retorna a cor CSS associada ao sentimento, baseada na categoria.
 * Para sentimentos legados (não presentes no config), retorna cor neutra.
 */
export function obterCorSentimento(sentimento: string): string {
  if (sentimento in SENTIMENTO_CONFIG) {
    const cat = SENTIMENTO_CONFIG[sentimento as keyof typeof SENTIMENTO_CONFIG].categoria;
    return CORES_CATEGORIA[cat];
  }
  return COR_LEGADO;
}
