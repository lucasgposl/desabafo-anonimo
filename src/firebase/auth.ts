import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  Unsubscribe,
  UserCredential,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Inicia o fluxo de autenticação com Google via popup.
 * Retorna o UserCredential em caso de sucesso.
 */
async function loginComGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

/**
 * Encerra a sessão do usuário autenticado.
 */
async function logout(): Promise<void> {
  return signOut(auth);
}

/**
 * Observa mudanças no estado de autenticação.
 * Chama o callback com o User quando autenticado ou null quando deslogado.
 * Retorna a função de unsubscribe para limpar o listener.
 */
function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export { googleProvider, loginComGoogle, logout, onAuthChange };
