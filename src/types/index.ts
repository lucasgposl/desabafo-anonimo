import { Timestamp } from 'firebase/firestore';
import { Sentimento, TipoReacao } from '../config/sentimentos';

// Re-exportar tipos derivados do config (single source of truth)
export type { Sentimento, TipoReacao };

// Estado do usuário autenticado no React
export interface UsuarioAuth {
  uid: string;
}

// Documento no Firestore (coleção: "desabafos")
export interface DesabafoDoc {
  texto: string;              // Texto do desabafo (1-2000 caracteres)
  sentimento: Sentimento;     // Categoria emocional
  criadoEm: Timestamp;       // Timestamp do Firestore (serverTimestamp)
  uid: string;                // Identificador do autor (Firebase Auth uid) - NÃO exposto no feed
  reacoes: Record<TipoReacao, number>; // Contadores de reação derivados do config
  totalComentarios: number;   // Contador de comentários (desnormalizado para performance)
  numero?: number;            // Número incremental para URL amigável
}

// Modelo no React para exibição no feed (SEM uid)
export interface Desabafo {
  id: string;                 // ID do documento Firestore
  texto: string;
  sentimento: string;         // string para suportar valores legados na leitura
  criadoEm: Date;            // Convertido de Timestamp para Date
  reacoes: Record<TipoReacao, number>; // Contadores de reação derivados do config
  totalComentarios: number;
  numero?: number;            // Número incremental para navegação via LinkVerMais
}

// Modelo para administradores (COM uid para moderação)
export interface DesabafoAdmin extends Desabafo {
  uid: string;
  numero?: number;            // Número incremental (disponível quando feature-003 estiver implementada)
}

// Documento no Firestore (subcoleção: "desabafos/{desabafoId}/comentarios")
export interface ComentarioDoc {
  texto: string;              // Texto do comentário (1-500 caracteres)
  criadoEm: Timestamp;       // Timestamp do Firestore (serverTimestamp)
  uid: string;                // Identificador do autor - NÃO exposto no feed
}

// Modelo no React para exibição (SEM uid)
export interface Comentario {
  id: string;                 // ID do documento Firestore
  texto: string;
  criadoEm: Date;
  desabafoId: string;         // Referência ao desabafo pai
}

// Modelo para administradores (COM uid)
export interface ComentarioAdmin extends Comentario {
  uid: string;
}

// Documento no Firestore (coleção: "admins")
// O ID do documento é o uid do Firebase Auth
export interface AdminDoc {
  criadoEm: Timestamp;       // Data de adição como admin
}

// Props do LoginButton
export interface LoginButtonProps {
  usuario: UsuarioAuth | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  isLoading: boolean;
}

// Props do InputBox
export interface InputBoxProps {
  onPublicar: (texto: string, sentimento: Sentimento) => Promise<void>;
  isPublicando: boolean;
}

// Props do Feed
export interface FeedProps {
  desabafos: Desabafo[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReagir: (id: string, tipo: TipoReacao) => void;
  usuarioAutenticado: boolean;
  reacaoUsuario?: Record<string, TipoReacao | null>;
  uid?: string | null;
  onVerDesabafo?: (numero: number) => void;
}

// Props do DesabafoCard
export interface DesabafoCardProps {
  desabafo: Desabafo;
  onReagir: (tipo: TipoReacao) => void;
  usuarioAutenticado: boolean;
  reacaoAtiva?: TipoReacao | null;
  uid?: string | null;
  onVerDesabafo?: (numero: number) => void;
}

// Props do ComentarioSection
export interface ComentarioSectionProps {
  desabafoId: string;
  usuarioAutenticado: boolean;
  uid?: string | null;
  limite?: number;              // Quantidade de comentários a buscar (undefined = todos)
  mostrarFormulario?: boolean;  // Exibe formulário? (default: true)
}

// Props do FeedControls
export interface FeedControlsProps {
  filtroAtivo: Sentimento | 'todos';
  onFiltroChange: (filtro: Sentimento | 'todos') => void;
  totalDesabafos: number;
}

// Props do ConfirmDialog
export interface ConfirmDialogProps {
  isOpen: boolean;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Props da PaginaModeracao
export interface PaginaModeracaoProps {
  isAdmin: boolean;
}
