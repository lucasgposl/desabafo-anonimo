import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Desabafo, DesabafoDoc } from '../types';

interface UseDesabafoResult {
  desabafo: Desabafo | null;
  carregando: boolean;
  naoEncontrado: boolean;
  erro: string | null;
}

/**
 * Hook para buscar um desabafo pelo campo `numero`.
 *
 * - Valida o numero antes de consultar o Firestore
 * - NaN, negativo ou 0 retorna naoEncontrado: true sem consulta
 * - Retorna o desabafo mapeado com id, texto, sentimento, criadoEm, reacoes, totalComentarios e numero
 *
 * Validates: Requirements 2.2, 5.1, 5.3
 */
export function useDesabafo(numero: number): UseDesabafoResult {
  const [desabafo, setDesabafo] = useState<Desabafo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Validação: numero inválido (NaN, negativo, 0) retorna naoEncontrado sem consultar Firestore
    if (isNaN(numero) || numero <= 0 || !Number.isFinite(numero)) {
      setDesabafo(null);
      setNaoEncontrado(true);
      setCarregando(false);
      setErro(null);
      return;
    }

    async function buscar() {
      setCarregando(true);
      setNaoEncontrado(false);
      setErro(null);
      setDesabafo(null);

      try {
        const q = query(
          collection(db, 'desabafos'),
          where('numero', '==', numero)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setNaoEncontrado(true);
        } else {
          const docSnap = snap.docs[0];
          const data = docSnap.data() as DesabafoDoc;
          setDesabafo({
            id: docSnap.id,
            texto: data.texto,
            sentimento: data.sentimento,
            criadoEm: data.criadoEm?.toDate() ?? new Date(),
            reacoes: data.reacoes,
            totalComentarios: data.totalComentarios ?? 0,
            numero: data.numero,
          });
        }
      } catch (e) {
        setErro('Erro ao carregar o desabafo.');
      } finally {
        setCarregando(false);
      }
    }

    buscar();
  }, [numero]);

  return { desabafo, carregando, naoEncontrado, erro };
}
