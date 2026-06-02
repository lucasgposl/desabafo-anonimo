import {
  doc,
  getDoc,
  collection,
  collectionGroup,
  query,
  orderBy,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { DesabafoAdmin, ComentarioAdmin, DesabafoDoc, ComentarioDoc } from '../types';

const COLECAO_ADMINS = 'admins';
const COLECAO_DESABAFOS = 'desabafos';

/**
 * Verifica se o usuário com o uid fornecido é um administrador.
 * Consulta a coleção "admins" no Firestore.
 */
export async function verificarAdmin(uid: string): Promise<boolean> {
  const adminRef = doc(db, COLECAO_ADMINS, uid);
  const adminSnap = await getDoc(adminRef);
  return adminSnap.exists();
}

/**
 * Adiciona um novo administrador à coleção "admins".
 * Requer que o chamador já seja admin (validado pelas regras do Firestore).
 */
export async function adicionarAdmin(uid: string, email: string): Promise<void> {
  const adminRef = doc(db, COLECAO_ADMINS, uid);
  await setDoc(adminRef, {
    email,
    criadoEm: serverTimestamp(),
  });
}

/**
 * Remove um administrador da coleção "admins".
 * Requer que o chamador já seja admin (validado pelas regras do Firestore).
 */
export async function removerAdmin(uid: string): Promise<void> {
  const adminRef = doc(db, COLECAO_ADMINS, uid);
  await deleteDoc(adminRef);
}

/**
 * Busca todos os administradores.
 * Requer que o chamador seja admin (validado pelas regras do Firestore).
 */
export async function buscarTodosAdmins(): Promise<{ uid: string; email: string; criadoEm: Date }[]> {
  const snapshot = await getDocs(collection(db, COLECAO_ADMINS));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      email: data.email ?? '',
      criadoEm: data.criadoEm?.toDate?.() ?? new Date(),
    };
  });
}

/**
 * Busca todos os desabafos COM uid para a página de moderação.
 * Apenas administradores devem chamar esta função.
 * Retorna lista ordenada do mais recente para o mais antigo.
 */
export async function buscarTodosDesabafosAdmin(): Promise<DesabafoAdmin[]> {
  const q = query(
    collection(db, COLECAO_DESABAFOS),
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
      uid: data.uid,
    };
  });
}

/**
 * Busca todos os comentários de todos os desabafos COM uid para a página de moderação.
 * Apenas administradores devem chamar esta função.
 * Retorna lista ordenada do mais recente para o mais antigo.
 */
export async function buscarTodosComentariosAdmin(): Promise<ComentarioAdmin[]> {
  const q = query(
    collectionGroup(db, 'comentarios'),
    orderBy('criadoEm', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as ComentarioDoc;
    // Extract desabafoId from the document path: desabafos/{desabafoId}/comentarios/{comentarioId}
    const pathSegments = docSnap.ref.path.split('/');
    const desabafoId = pathSegments[1];

    return {
      id: docSnap.id,
      texto: data.texto,
      criadoEm: data.criadoEm?.toDate() ?? new Date(),
      desabafoId,
      uid: data.uid,
    };
  });
}
