import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
  runTransaction,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import type { Sentimento, TipoReacao, Desabafo, DesabafoDoc, DesabafoAdmin } from '../types';

const COLECAO = 'desabafos';

export interface QueryResult {
  desabafos: Desabafo[];
  ultimoDoc: DocumentSnapshot | null;
}

/**
 * Wrapper para operações assíncronas com timeout.
 * Retorna null em caso de erro ou timeout.
 */
export async function operacaoSegura<T>(
  operacao: () => Promise<T>,
  onError: (error: Error) => void,
  timeout: number = 10000
): Promise<T | null> {
  try {
    const resultado = await Promise.race([
      operacao(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
    return resultado;
  } catch (error) {
    onError(error as Error);
    return null;
  }
}

/**
 * Cria um novo desabafo no Firestore usando transação atômica.
 * Gera um `numero` incremental lendo e incrementando `config/counters.totalDesabafos`.
 * Se o documento `config/counters` não existir, cria com totalDesabafos: 1.
 * Requer uid do usuário autenticado.
 * Retorna o ID do documento criado.
 */
export async function criarDesabafo(
  texto: string,
  sentimento: Sentimento,
  uid: string
): Promise<string> {
  const countersRef = doc(db, 'config', 'counters');
  const novoDesabafoRef = doc(collection(db, COLECAO));

  await runTransaction(db, async (transaction) => {
    const countersSnap = await transaction.get(countersRef);
    const total = countersSnap.exists()
      ? (countersSnap.data().totalDesabafos ?? 0)
      : 0;
    const numero = total + 1;

    transaction.set(countersRef, { totalDesabafos: numero }, { merge: true });

    transaction.set(novoDesabafoRef, {
      texto,
      sentimento,
      uid,
      criadoEm: serverTimestamp(),
      reacoes: {
        apoio: 0,
        forca: 0,
        pouco: 0,
      },
      totalComentarios: 0,
      numero,
    });
  });

  return novoDesabafoRef.id;
}

/**
 * Busca desabafos com filtro, paginação e cursor.
 * Projeta os resultados SEM o campo uid para garantir anonimato no feed.
 * Retorna os desabafos convertidos e o último documento para paginação.
 */
export async function buscarDesabafos(
  filtro: Sentimento | 'todos',
  limite: number,
  cursor?: DocumentSnapshot
): Promise<QueryResult> {
  const constraints: QueryConstraint[] = [];

  if (filtro !== 'todos') {
    constraints.push(where('sentimento', '==', filtro));
  }

  constraints.push(orderBy('criadoEm', 'desc'));
  constraints.push(limit(limite));

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const q = query(collection(db, COLECAO), ...constraints);
  const snapshot = await getDocs(q);

  const desabafos: Desabafo[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DesabafoDoc;
    return {
      id: docSnap.id,
      texto: data.texto,
      sentimento: data.sentimento,
      criadoEm: data.criadoEm?.toDate() ?? new Date(),
      reacoes: data.reacoes,
      totalComentarios: data.totalComentarios ?? 0,
      numero: data.numero,
      // uid é intencionalmente excluído para garantir anonimato
    };
  });

  const ultimoDoc =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return { desabafos, ultimoDoc };
}

/**
 * Busca todos os desabafos dos últimos 30 dias para a página Trends.
 * Projeta os resultados SEM o campo uid para garantir anonimato.
 * A ordenação por popularidade é feita no cliente.
 */
export async function buscarDesabafosTrends(): Promise<Desabafo[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const q = query(
    collection(db, COLECAO),
    where('criadoEm', '>=', Timestamp.fromDate(thirtyDaysAgo)),
    orderBy('criadoEm', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DesabafoDoc;
    return {
      id: docSnap.id,
      texto: data.texto,
      sentimento: data.sentimento,
      criadoEm: data.criadoEm?.toDate() ?? new Date(),
      reacoes: data.reacoes,
      totalComentarios: data.totalComentarios ?? 0,
      numero: data.numero,
      // uid é intencionalmente excluído para garantir anonimato
    };
  });
}

/**
 * Busca todos os desabafos COM uid para a página de moderação.
 * Apenas administradores devem chamar esta função.
 */
export async function buscarTodosDesabafosAdmin(): Promise<DesabafoAdmin[]> {
  const q = query(collection(db, COLECAO), orderBy('criadoEm', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DesabafoDoc;
    return {
      id: docSnap.id,
      texto: data.texto,
      sentimento: data.sentimento,
      criadoEm: data.criadoEm?.toDate() ?? new Date(),
      reacoes: data.reacoes,
      totalComentarios: data.totalComentarios ?? 0,
      uid: data.uid,
    };
  });
}

/**
 * Incrementa atomicamente o contador de uma reação específica.
 * Não requer autenticação.
 */
export async function incrementarReacao(
  desabafoId: string,
  tipo: TipoReacao
): Promise<void> {
  const docRef = doc(db, COLECAO, desabafoId);
  await updateDoc(docRef, {
    [`reacoes.${tipo}`]: increment(1),
  });
}

/**
 * Remove um desabafo e todos os seus comentários associados.
 * Apenas administradores devem chamar esta função.
 */
export async function removerDesabafo(desabafoId: string): Promise<void> {
  // Primeiro, remover todos os comentários da subcoleção
  const comentariosRef = collection(db, COLECAO, desabafoId, 'comentarios');
  const comentariosSnapshot = await getDocs(comentariosRef);

  if (!comentariosSnapshot.empty) {
    const batch = writeBatch(db);
    comentariosSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }

  // Depois, remover o desabafo
  await deleteDoc(doc(db, COLECAO, desabafoId));
}

/**
 * Apaga todos os desabafos e seus comentários associados.
 * Apenas administradores devem chamar esta função.
 */
export async function apagarTodosDesabafos(): Promise<void> {
  const snapshot = await getDocs(collection(db, COLECAO));

  if (snapshot.empty) return;

  // Para cada desabafo, remover seus comentários primeiro
  for (const desabafoDoc of snapshot.docs) {
    const comentariosRef = collection(db, COLECAO, desabafoDoc.id, 'comentarios');
    const comentariosSnapshot = await getDocs(comentariosRef);

    if (!comentariosSnapshot.empty) {
      const batch = writeBatch(db);
      comentariosSnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  }

  // Depois, remover todos os desabafos
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}
