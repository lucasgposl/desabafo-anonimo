import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';

/**
 * Componente de proteção de rota para páginas administrativas.
 *
 * Verifica:
 * 1. Se o usuário está autenticado (useAuth)
 * 2. Se o usuário autenticado é admin (useAdmin)
 *
 * Comportamento:
 * - Exibe loading enquanto verifica autenticação e status de admin
 * - Redireciona visitantes para "/" com mensagem "Faça login para acessar."
 * - Redireciona não-admins para "/" com mensagem "Acesso negado."
 * - Renderiza children se o usuário é admin
 *
 * Validates: Requirements 7.9, 7.10
 */
export function RotaProtegidaAdmin({ children }: { children: React.ReactNode }) {
  const { usuario, isLoading: isAuthLoading } = useAuth();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin(usuario?.uid ?? null);

  // Enquanto auth está carregando, mostrar loading
  if (isAuthLoading) {
    return (
      <div className="rota-protegida__loading" role="status" aria-label="Verificando permissões">
        <p className="rota-protegida__loading-texto">Verificando permissões...</p>
      </div>
    );
  }

  // Se não está autenticado (auth já resolveu)
  if (!usuario) {
    return <Navigate to="/" replace state={{ mensagem: 'Faça login para acessar.' }} />;
  }

  // Enquanto admin está carregando, mostrar loading
  if (isAdminLoading) {
    return (
      <div className="rota-protegida__loading" role="status" aria-label="Verificando permissões">
        <p className="rota-protegida__loading-texto">Verificando permissões...</p>
      </div>
    );
  }

  // Se não é admin
  if (!isAdmin) {
    return <Navigate to="/" replace state={{ mensagem: 'Acesso negado.' }} />;
  }

  return <>{children}</>;
}
