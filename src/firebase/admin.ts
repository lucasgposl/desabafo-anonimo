import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { DesabafoAdmin, DesabafoDoc } from '../types';

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

function mapDesabafoAdmin(docSnap: DocumentSnapshot): DesabafoAdmin {
  const data = docSnap.data() as DesabafoDoc;
  const mapped: DesabafoAdmin = {
    id: docSnap.id,
    texto: data.texto,
    sentimento: data.sentimento,
    criadoEm: data.criadoEm?.toDate() ?? new Date(),
    reacoes: data.reacoes,
    totalComentarios: data.totalComentarios ?? 0,
    uid: data.uid,
  };
  // Include numero field when available (feature-003 dependency)
  const rawData = docSnap.data() as Record<string, unknown>;
  if (typeof rawData.numero === 'number') {
    mapped.numero = rawData.numero;
  }
  return mapped;
}

/**
 * Busca desabafos COM uid para a página de moderação, com suporte a paginação por cursor.
 * Apenas administradores devem chamar esta função.
 * Retorna lista ordenada do mais recente para o mais antigo (até `limite` itens) e o último documento
 * para uso como cursor na próxima página.
 */
export async function buscarTodosDesabafosAdmin(
  limite: number = 25,
  cursor?: DocumentSnapshot
): Promise<{ desabafos: DesabafoAdmin[]; ultimoDoc: DocumentSnapshot | null }> {
  const constraints: Parameters<typeof query>[1][] = [
    orderBy('criadoEm', 'desc'),
    limit(limite),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  const q = query(collection(db, COLECAO_DESABAFOS), ...constraints);
  const snapshot = await getDocs(q);

  return {
    desabafos: snapshot.docs.map(mapDesabafoAdmin),
    ultimoDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
  };
}

/**
 * Busca um desabafo pelo seu número incremental para a página de moderação.
 * Apenas administradores devem chamar esta função.
 * Requer index em `numero` (ASC) na coleção `desabafos` — compartilhado com feature-003.
 * Retorna o desabafo encontrado ou null se não existir.
 */
export async function buscarDesabafoAdminPorNumero(numero: number): Promise<DesabafoAdmin | null> {
  const q = query(
    collection(db, COLECAO_DESABAFOS),
    where('numero', '==', numero)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  return mapDesabafoAdmin(snapshot.docs[0]);
}


