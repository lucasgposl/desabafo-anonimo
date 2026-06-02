import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import type { Comentario, ComentarioDoc } from '../types';

const COLECAO_DESABAFOS = 'desabafos';
const SUBCOLECAO_COMENTARIOS = 'comentarios';

/**
 * Cria um novo comentário na subcoleção de comentários de um desabafo.
 * Incrementa atomicamente o campo `totalComentarios` no documento pai.
 * Requer uid do usuário autenticado.
 * Retorna o ID do documento criado.
 */
export async function criarComentario(
  desabafoId: string,
  texto: string,
  uid: string
): Promise<string> {
  const comentariosRef = collection(
    db,
    COLECAO_DESABAFOS,
    desabafoId,
    SUBCOLECAO_COMENTARIOS
  );

  const docRef = await addDoc(comentariosRef, {
    texto,
    uid,
    criadoEm: serverTimestamp(),
  });

  // Incrementar totalComentarios no documento pai
  const desabafoRef = doc(db, COLECAO_DESABAFOS, desabafoId);
  await updateDoc(desabafoRef, {
    totalComentarios: increment(1),
  });

  return docRef.id;
}

/**
 * Busca comentários de um desabafo ordenados por data ASC (mais antigo primeiro).
 * Projeta os resultados SEM o campo uid para garantir anonimato no feed.
 * Retorna os comentários convertidos.
 */
export async function buscarComentarios(
  desabafoId: string,
  limite: number = 50
): Promise<Comentario[]> {
  const comentariosRef = collection(
    db,
    COLECAO_DESABAFOS,
    desabafoId,
    SUBCOLECAO_COMENTARIOS
  );

  const q = query(
    comentariosRef,
    orderBy('criadoEm', 'asc'),
    limit(limite)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as ComentarioDoc;
    return {
      id: docSnap.id,
      texto: data.texto,
      criadoEm: data.criadoEm?.toDate() ?? new Date(),
      desabafoId,
      // uid é intencionalmente excluído para garantir anonimato
    };
  });
}

/**
 * Remove um comentário específico de um desabafo.
 * Decrementa atomicamente o campo `totalComentarios` no documento pai.
 * Apenas administradores devem chamar esta função.
 */
export async function removerComentario(
  desabafoId: string,
  comentarioId: string
): Promise<void> {
  const comentarioRef = doc(
    db,
    COLECAO_DESABAFOS,
    desabafoId,
    SUBCOLECAO_COMENTARIOS,
    comentarioId
  );

  await deleteDoc(comentarioRef);

  // Decrementar totalComentarios no documento pai
  const desabafoRef = doc(db, COLECAO_DESABAFOS, desabafoId);
  await updateDoc(desabafoRef, {
    totalComentarios: increment(-1),
  });
}

/**
 * Remove todos os comentários da subcoleção de um desabafo.
 * Atualiza o campo `totalComentarios` para 0 no documento pai.
 * Apenas administradores devem chamar esta função.
 */
export async function removerComentariosDoDesabafo(
  desabafoId: string
): Promise<void> {
  const comentariosRef = collection(
    db,
    COLECAO_DESABAFOS,
    desabafoId,
    SUBCOLECAO_COMENTARIOS
  );

  const snapshot = await getDocs(comentariosRef);

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();

  // Atualizar totalComentarios para 0 no documento pai
  const desabafoRef = doc(db, COLECAO_DESABAFOS, desabafoId);
  await updateDoc(desabafoRef, {
    totalComentarios: 0,
  });
}
